// What the newer end-to-end scripts share: a temporary SQLite database, the seeds, the app server (development or
// production), Chromium and the list of checks. The first scripts (support, kiosk...) keep their own copy of this.
//
// Browser: set E2E_CHROMIUM_PATH to an installed Chromium, or run `npx playwright-core install chromium` and leave it
// unset. Screenshots go to e2e/screenshots (override with E2E_SCREENSHOTS_DIR). E2E_KEEP_FILES=1 keeps the database and
// the server log; they are also kept when a check fails. The scripts must run through npm (`npm run test:e2e:<name>`):
// npm sets npm_execpath, which runs the seeds.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, openSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright-core";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const UI_TIMEOUT_MS = 20_000;

const NEXT_CLI = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

const SERVER_READY_TIMEOUT_MS = 180_000;

/**
 * Runs one script: prepares the database and the server, calls `scenario` and reports the checks.
 * `mode` "dev" runs `next dev`; "start" builds and runs `next start` (the service worker only exists in production).
 * `seeds` are npm scripts ("db:seed:stands" or ["db:seed:demo", "--open-raffle"]) that run after db:deploy and db:seed.
 * `siteUrl` is NEXT_PUBLIC_SITE_URL; without it the site is the address of the server.
 */
export async function runE2e({ name, port, mode = "dev", seeds = [], siteUrl, env = {}, scenario }) {
  const workdir = mkdtempSync(path.join(tmpdir(), `ut-e3-e2e-${name}-`));
  const screenshots = process.env.E2E_SCREENSHOTS_DIR ?? path.join(ROOT, "e2e", "screenshots");
  const baseUrl = `http://localhost:${port}`;
  const databaseFile = path.join(workdir, "e2e.db");
  const results = [];

  mkdirSync(screenshots, { recursive: true });

  const appEnv = buildEnvironment({ databaseFile, siteUrl: siteUrl ?? baseUrl, extra: env });

  prepareApp({ mode, seeds, appEnv });

  const server = startServer({ mode, port, appEnv, logFile: path.join(workdir, "server.log") });
  const context = { baseUrl, databaseFile, screenshots, check: createCheck(results) };
  let browser;

  try {
    await waitForServer(baseUrl);
    browser = await launchBrowser();
    await scenario({ ...context, browser, database: new DatabaseSync(databaseFile) });
  } finally {
    await browser?.close();
    await stopServer(server);
  }

  return finish({ results, workdir, screenshots });
}

export function count(database, table, where = "1 = 1") {
  return database.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`).get().n;
}

/** A date as event_settings stores it, in the same format as the row has (the seeds and the app differ). */
export function storedDate(database, column, milliseconds) {
  const { current } = database.prepare(`SELECT ${column} AS current FROM event_settings WHERE id = 1`).get();

  return /^\d+$/.test(String(current)) ? milliseconds : new Date(milliseconds).toISOString();
}

export async function signIn(page, { baseUrl, email, password }) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

function createCheck(results) {
  return (name, ok, detail = "") => {
    const suffix = detail ? ` -- ${detail}` : "";

    results.push({ name, ok: Boolean(ok) });
    console.log(`${ok ? "PASS" : "FAIL"} ${name}${suffix}`);
  };
}

function buildEnvironment({ databaseFile, siteUrl, extra }) {
  return {
    ...process.env,
    DATABASE_URL: `file:${databaseFile}`,
    PIN_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    NEXT_PUBLIC_SITE_URL: siteUrl,
    // Closed port: the mail outbox keeps the emails and retries, as in production.
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "1",
    SMTP_USER: "e2e",
    SMTP_PASSWORD: "e2e",
    SMTP_FROM: "e2e@example.test",
    SYSADMIN_EMAIL: "sysadmin@example.test",
    SYSADMIN_NAME: "Sysadmin",
    SYSADMIN_PASSWORD: "E2e-Sysadmin-2026!",
    ...extra,
  };
}

// The seeds of the demo refuse to run in production, so they always run in development mode; a production server is
// built with the production environment.
function prepareApp({ mode, seeds, appEnv }) {
  const seedEnv = { ...appEnv, NODE_ENV: "development" };

  runNpmScript(["db:deploy"], seedEnv);
  runNpmScript(["db:seed"], seedEnv);

  for (const seed of seeds) runNpmScript([seed].flat(), seedEnv);

  if (mode !== "start") return;

  const build = spawnSync(process.execPath, [NEXT_CLI, "build"], {
    env: { ...appEnv, NODE_ENV: "production" },
    stdio: "inherit",
    cwd: ROOT,
  });

  if (build.status !== 0) throw new Error(`next build failed with exit code ${build.status}`);
}

function runNpmScript([script, ...args], env) {
  const flags = args.length > 0 ? ["--", ...args] : [];

  const result = spawnSync(process.execPath, [process.env.npm_execpath, "run", script, ...flags], {
    env,
    stdio: "inherit",
  });

  if (result.status !== 0) throw new Error(`npm run ${script} failed with exit code ${result.status}`);
}

function startServer({ mode, port, appEnv, logFile }) {
  const log = openSync(logFile, "w");
  const env = mode === "start" ? { ...appEnv, NODE_ENV: "production" } : appEnv;

  return spawn(process.execPath, [NEXT_CLI, mode, "-p", String(port)], { env, stdio: ["ignore", log, log] });
}

// The server starts child processes that keep the database open; on Windows only the whole tree releases it.
async function stopServer(server) {
  if (process.platform === "win32") {
    const taskkill = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "taskkill.exe");

    spawnSync(taskkill, ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    server.kill();
  }

  await delay(1000);
}

async function waitForServer(baseUrl) {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/offline`, { redirect: "manual" });

      if (response.status < 500) return;
    } catch {
      // The server is still starting; retry until the deadline.
    }

    await delay(1000);
  }

  throw new Error(`The server did not answer on ${baseUrl} within ${SERVER_READY_TIMEOUT_MS} ms`);
}

async function launchBrowser() {
  try {
    return await chromium.launch({ executablePath: process.env.E2E_CHROMIUM_PATH || undefined, headless: true });
  } catch (error) {
    throw new Error(
      `No se pudo abrir Chromium (${error.message.split("\n")[0]}). Instálalo con "npx playwright-core install chromium" o define E2E_CHROMIUM_PATH.`,
    );
  }
}

// Cleaning up is best effort: a file still held by Windows must not turn passing checks into a failure.
function finish({ results, workdir, screenshots }) {
  const failed = results.filter((result) => !result.ok);
  const summary = `\n${results.length - failed.length}/${results.length} checks passed.`;

  console.log(`Screenshots: ${screenshots}`);

  if (failed.length > 0 || process.env.E2E_KEEP_FILES) {
    console.log(`${summary} Database and server log kept in ${workdir}`);

    return failed.length === 0 ? 0 : 1;
  }

  try {
    rmSync(workdir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  } catch (error) {
    console.log(`No se pudo borrar ${workdir} (${error.code}); puedes borrarlo a mano.`);
  }

  console.log(summary);

  return 0;
}

export function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

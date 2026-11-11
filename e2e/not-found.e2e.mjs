// End-to-end check of the 404 pages (issue #108) with a real browser: npm run test:e2e:not-found
//
// Opens an unknown route and an unknown game slug at 360, 390, 844 in landscape and 1440 px. Checks the ways out (games,
// floor plan and schedule), the games offered by the game 404, noindex, no horizontal scroll and 44x44 px touch
// targets, and saves a screenshot of each. Creates its own SQLite database in the system temp dir, seeds it
// (db:seed), starts `next dev` on E2E_PORT and removes everything when it finishes.
//
// Browser: set E2E_CHROMIUM_PATH to an installed Chromium, or run `npx playwright-core install chromium`
// (https://playwright.dev/docs/browsers) and leave it unset. Screenshots go to e2e/screenshots (not versioned;
// override with E2E_SCREENSHOTS_DIR). E2E_KEEP_FILES=1 keeps the database and the server log.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, openSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const NEXT_CLI = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

const PORT = Number(process.env.E2E_PORT ?? 3541);

const BASE_URL = `http://localhost:${PORT}`;

const SERVER_READY_TIMEOUT_MS = 180_000;

const UI_TIMEOUT_MS = 20_000;

const results = [];

main().then(
  (exitCode) => {
    process.exitCode = exitCode;
  },
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);

async function main() {
  const workdir = mkdtempSync(path.join(tmpdir(), "ut-e3-e2e-not-found-"));
  const screenshots = process.env.E2E_SCREENSHOTS_DIR ?? path.join(ROOT, "e2e", "screenshots");
  mkdirSync(screenshots, { recursive: true });

  const env = buildEnvironment(workdir);
  prepareDatabase(env);

  const server = startDevServer(env, path.join(workdir, "dev.log"));
  let browser;

  try {
    await waitForServer();
    browser = await launchBrowser();
    await runScenario(browser, screenshots);
  } finally {
    await browser?.close();
    await stopServer(server);
  }

  const failed = results.filter((result) => !result.ok);
  const summary = `\n${results.length - failed.length}/${results.length} checks passed.`;

  console.log(`Screenshots: ${screenshots}`);

  if (failed.length === 0 && !process.env.E2E_KEEP_FILES) {
    removeWorkdir(workdir);
    console.log(summary);
  } else {
    console.log(`${summary} Database and server log kept in ${workdir}`);
  }

  return failed.length === 0 ? 0 : 1;
}

function buildEnvironment(workdir) {
  return {
    ...process.env,
    DATABASE_URL: `file:${path.join(workdir, "e2e.db")}`,
    PIN_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    NEXT_PUBLIC_SITE_URL: BASE_URL,
    SYSADMIN_EMAIL: "sysadmin@example.test",
    SYSADMIN_NAME: "Sysadmin",
    SYSADMIN_PASSWORD: "E2e-Sysadmin-2026!",
  };
}

function prepareDatabase(env) {
  runNpmScript("db:deploy", env);
  runNpmScript("db:seed", env);
}

// npm sets npm_execpath when it runs this script (`npm run test:e2e:not-found`), so the same npm CLI runs the seeds.
function runNpmScript(name, env) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, "run", name], { env, stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`npm run ${name} failed with exit code ${result.status}`);
  }
}

function startDevServer(env, logFile) {
  const log = openSync(logFile, "w");

  return spawn(process.execPath, [NEXT_CLI, "dev", "-p", String(PORT)], {
    env,
    stdio: ["ignore", log, log],
  });
}

// `next dev` starts child processes that keep the database open; on Windows only the whole tree releases it.
async function stopServer(server) {
  if (process.platform === "win32") {
    const taskkill = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "taskkill.exe");

    spawnSync(taskkill, ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    server.kill();
  }

  await delay(1000);
}

// Cleaning up is best effort: a file still held by Windows must not turn passing checks into a failure.
function removeWorkdir(workdir) {
  try {
    rmSync(workdir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  } catch (error) {
    console.log(`No se pudo borrar ${workdir} (${error.code}); puedes borrarlo a mano.`);
  }
}

async function waitForServer() {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/passport`, { redirect: "manual" });

      if (response.status < 500) {
        return;
      }
    } catch {
      // The server is still compiling; retry until the deadline.
    }

    await delay(1000);
  }

  throw new Error(`next dev did not answer on ${BASE_URL} within ${SERVER_READY_TIMEOUT_MS} ms`);
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

const VIEWPORTS = [
  { name: "360", width: 360, height: 740 },
  { name: "390", width: 390, height: 844 },
  { name: "844-landscape", width: 844, height: 390 },
  { name: "1440", width: 1440, height: 900 },
];

async function runScenario(browser, screenshots) {
  const consoleErrors = [];

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();

    page.on("pageerror", (error) => consoleErrors.push(String(error)));

    try {
      await checkGenericNotFound(page, viewport, screenshots);
      await checkGameNotFound(page, viewport, screenshots);
    } finally {
      await context.close();
    }
  }

  check("no uncaught page errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");
}

async function checkGenericNotFound(page, viewport, screenshots) {
  await page.goto(`${BASE_URL}/no-existe-esta-pagina`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1, name: "Página no encontrada" }).waitFor({ timeout: UI_TIMEOUT_MS });
  await page.screenshot({ path: path.join(screenshots, `not-found-${viewport.name}.png`), fullPage: true });

  const exits = page.getByRole("navigation", { name: "Sigue explorando" });
  const hrefs = await exits.getByRole("link").evaluateAll((links) => links.map((link) => link.getAttribute("href")));

  check(
    `${viewport.name}: the 404 offers games, floor plan and schedule`,
    hrefs.join(" ") === "/games /#floor-plan /#schedule",
    hrefs.join(" "),
  );
  check(
    `${viewport.name}: the 404 links back home`,
    await page.getByRole("link", { name: /Volver al inicio/ }).isVisible(),
  );
  await checkLayout(page, viewport, "404");
}

async function checkGameNotFound(page, viewport, screenshots) {
  await page.goto(`${BASE_URL}/games/juego-que-no-existe`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1, name: "Juego no encontrado" }).waitFor({ timeout: UI_TIMEOUT_MS });
  await page.screenshot({ path: path.join(screenshots, `game-not-found-${viewport.name}.png`), fullPage: true });

  const games = page.getByRole("region", { name: "Más juegos" }).getByRole("listitem");
  const robots = await page.locator('meta[name="robots"]').first().getAttribute("content");

  check(`${viewport.name}: an unknown game says that the game does not exist`, true);
  check(
    `${viewport.name}: and shows five games to keep browsing`,
    (await games.count()) === 5,
    String(await games.count()),
  );
  check(`${viewport.name}: and is not indexed`, /noindex/.test(robots ?? ""), robots);
  await checkLayout(page, viewport, "game 404");
}

async function checkLayout(page, viewport, label) {
  const layout = await page.evaluate(() => {
    const main = document.querySelector("main");

    // A link smaller than 44x44 px passes only if it has the invisible ::after of the touch-target utility.
    const small = [...main.querySelectorAll("a, button")].flatMap((element) => {
      const box = element.getBoundingClientRect();
      const isSmall = box.width > 0 && (box.width < 44 || box.height < 44);
      const hasTouchTarget = getComputedStyle(element, "::after").content !== "none";

      return isSmall && !hasTouchTarget
        ? [`${element.textContent.trim().slice(0, 20)} ${Math.round(box.width)}x${Math.round(box.height)}`]
        : [];
    });

    return { scrollWidth: document.documentElement.scrollWidth, width: window.innerWidth, small };
  });

  check(
    `${viewport.name}: ${label} has no horizontal scroll`,
    layout.scrollWidth <= layout.width,
    `${layout.scrollWidth}/${layout.width}`,
  );
  check(
    `${viewport.name}: ${label} touch targets are at least 44x44 px`,
    layout.small.length === 0,
    layout.small.join(", "),
  );
}

function check(name, ok, detail = "") {
  const status = ok ? "PASS" : "FAIL";
  const suffix = detail ? ` -- ${detail}` : "";

  results.push({ name, ok: Boolean(ok) });
  console.log(`${status} ${name}${suffix}`);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

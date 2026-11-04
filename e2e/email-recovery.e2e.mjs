// End-to-end check of the passport recovery by email (E2E-03) with real browsers: npm run test:e2e:email-recovery
//
// A visitor registers on phone A. On phone B, /passport sends to /register, which links to "Recuperar mi pasaporte";
// the visitor asks for the link, B opens it from the captured email and confirms, and A loses access. The same link
// does not work twice, the answer is the same for an unknown email, and the fourth request of the hour sends nothing.
// Creates its own SQLite database in the system temp dir, seeds it (db:seed and db:seed:stands, which opens the
// registration), starts `next dev` on E2E_PORT and removes everything when it finishes. The SMTP port is closed, so
// the emails stay in email_outbox, where the checks read the link.
//
// Browser: set E2E_CHROMIUM_PATH to an installed Chromium, or run `npx playwright-core install chromium`
// (https://playwright.dev/docs/browsers) and leave it unset. Screenshots go to e2e/screenshots (not versioned;
// override with E2E_SCREENSHOTS_DIR). E2E_KEEP_FILES=1 keeps the database and the server log; they are also kept
// when a check fails.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, openSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const NEXT_CLI = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

const PORT = Number(process.env.E2E_PORT ?? 3541);

const BASE_URL = `http://localhost:${PORT}`;

const FULL_NAME = "E2E Trinity";

const GAMERTAG = "e2e_trinity";

const EMAIL = "e2e-trinity@example.test";

const RECOVERY_SUBJECT = "Recupera tu pasaporte";

const GENERIC_MESSAGE = "Si el correo está registrado, te enviamos un enlace.";

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
  const workdir = mkdtempSync(path.join(tmpdir(), "ut-e3-e2e-email-recovery-"));
  const screenshots = process.env.E2E_SCREENSHOTS_DIR ?? path.join(ROOT, "e2e", "screenshots");
  mkdirSync(screenshots, { recursive: true });

  const env = buildEnvironment(workdir);
  const databaseFile = path.join(workdir, "e2e.db");
  prepareDatabase(env);

  const server = startDevServer(env, path.join(workdir, "dev.log"));
  let browser;

  try {
    await waitForServer();
    browser = await launchBrowser();
    await runScenario(browser, databaseFile, screenshots);
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
    // Closed port: the outbox keeps every email and retries, as in production when the SMTP server is down.
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "1",
    SMTP_USER: "e2e",
    SMTP_PASSWORD: "e2e",
    SMTP_FROM: "e2e@example.test",
    SYSADMIN_EMAIL: "sysadmin@example.test",
    SYSADMIN_NAME: "Sysadmin",
    SYSADMIN_PASSWORD: "E2e-Sysadmin-2026!",
    STAND_DEV_PASSWORD: "stand-dev-password",
  };
}

// db:seed:stands also opens the registration of passports, which the event settings keep closed until November 13.
function prepareDatabase(env) {
  runNpmScript("db:deploy", env);
  runNpmScript("db:seed", env);
  runNpmScript("db:seed:stands", env);
}

// npm sets npm_execpath when it runs this script (`npm run test:e2e:email-recovery`), so the same npm CLI runs the seeds.
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

async function runScenario(browser, databaseFile, screenshots) {
  const database = new DatabaseSync(databaseFile);
  const consoleErrors = [];

  const contexts = {
    phoneA: await browser.newContext({ viewport: { width: 360, height: 740 } }),
    phoneB: await browser.newContext({ viewport: { width: 390, height: 844 } }),
    stranger: await browser.newContext({ viewport: { width: 360, height: 740 } }),
  };

  const pages = {};

  for (const [name, context] of Object.entries(contexts)) {
    pages[name] = await context.newPage();
    pages[name].on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    pages[name].on("pageerror", (error) => consoleErrors.push(String(error)));
  }

  try {
    const pin = await registerVisitor(pages.phoneA);

    await openRecoveryFromPassport(pages.phoneB, screenshots);
    await requestLink(pages.phoneB, EMAIL, path.join(screenshots, "email-recovery-sent.png"));

    const link = await readRecoveryLink(database, 1);

    await checkUnknownEmailGetsTheSameAnswer(pages.stranger, database);
    await checkNewPhoneUsesTheLink(pages.phoneB, { link, pin, screenshots });
    await checkOldPhoneLostAccess(pages.phoneA);
    checkTheRecoveryIsAudited(database);
    await checkTheLinkOnlyWorksOnce(pages.stranger, link, screenshots);
    await checkHourlyLimit(pages.stranger, database);
  } finally {
    check("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");

    for (const context of Object.values(contexts)) await context.close();
    database.close();
  }
}

async function registerVisitor(page) {
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Nombre completo").fill(FULL_NAME);
  await page.getByLabel("Gamertag").fill(GAMERTAG);
  await page.getByLabel("Correo electrónico").fill(EMAIL);
  await page.getByRole("button", { name: "Registrar pasaporte" }).click();
  await page.waitForURL(/\/passport$/, { timeout: 30_000 });

  const pin = (await page.locator("p.type-mono").first().textContent()).trim();
  check("visitor registers on phone A and gets a five-digit PIN", /^\d{5}$/.test(pin), pin);

  return pin;
}

// A phone without a passport that opens /passport lands on /register, which links to the recovery page.
async function openRecoveryFromPassport(page, screenshots) {
  await page.goto(`${BASE_URL}/passport`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/register$/, { timeout: UI_TIMEOUT_MS });
  await page.getByRole("link", { name: /Recupéralo por correo/ }).click();
  await page.waitForURL(/\/passport\/recover$/, { timeout: UI_TIMEOUT_MS });
  await page.getByRole("heading", { name: "Recuperar mi pasaporte" }).waitFor({ timeout: UI_TIMEOUT_MS });
  await page.screenshot({ path: path.join(screenshots, "email-recovery-form.png"), fullPage: true });

  check("phone B goes from /passport to /register and from its link to /passport/recover", true, page.url());
  check("the recovery page has no horizontal scroll at 390 px", await hasNoHorizontalScroll(page));
}

async function requestLink(page, email, screenshotPath) {
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByRole("button", { name: "Enviar enlace" }).click();

  const status = page.getByRole("status").filter({ hasText: GENERIC_MESSAGE });

  await status.waitFor({ timeout: UI_TIMEOUT_MS });

  if (screenshotPath) await page.screenshot({ path: screenshotPath, fullPage: true });

  const message = await status.textContent();

  check(`the request for ${email} shows the generic message`, message.includes(GENERIC_MESSAGE));

  return message;
}

// The email is queued after the answer (`after()`), so the check waits for the row instead of reading it at once.
async function readRecoveryLink(database, expected) {
  const rows = await waitForRecoveryEmails(database, expected);
  const { text, to_address: to } = rows.at(-1);
  const links = text.match(/https?:\/\/\S+/g) ?? [];

  check("the recovery email goes to the registered address", to === EMAIL, to);
  check(
    "the email carries exactly one link, to /passport/claim/",
    links.length === 1 && links[0].includes("/passport/claim/"),
  );
  check("the email carries no gamertag nor name (RF-71)", !text.includes(GAMERTAG) && !text.includes("Trinity"));
  check("the email does not carry a five-digit PIN (RF-71)", !/\b\d{5}\b/.test(text));

  return links[0];
}

async function checkUnknownEmailGetsTheSameAnswer(page, database) {
  await page.goto(`${BASE_URL}/passport/recover`, { waitUntil: "networkidle" });
  await requestLink(page, "nadie-registrado@example.test");
  await delay(2000);

  check("an unknown email queues no email", recoveryEmails(database).length === 1);
}

async function checkNewPhoneUsesTheLink(page, { link, pin, screenshots }) {
  await page.goto(link, { waitUntil: "networkidle" });
  await page.waitForURL(/\/passport\/recover\/confirm#/, { timeout: UI_TIMEOUT_MS });
  await page.getByRole("heading", { name: "Abrir mi pasaporte aquí" }).waitFor({ timeout: UI_TIMEOUT_MS });
  await page.screenshot({ path: path.join(screenshots, "email-recovery-confirm.png"), fullPage: true });
  check("opening the link shows the confirmation, with the token only in the fragment", !page.url().includes("?"));

  await page.getByRole("button", { name: "Abrir mi pasaporte" }).click();
  await page.waitForURL(/\/passport$/, { timeout: UI_TIMEOUT_MS });

  const shown = (await page.locator("p.type-mono").first().textContent()).trim();

  await page.screenshot({ path: path.join(screenshots, "email-recovery-passport.png"), fullPage: true });
  check("phone B confirms and sees the same passport and PIN", shown === pin, shown);
}

async function checkOldPhoneLostAccess(page) {
  await page.goto(`${BASE_URL}/passport`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/register$/, { timeout: UI_TIMEOUT_MS });
  check("phone A lost access -> /register (RF-70)", page.url().endsWith("/register"), page.url());
}

function checkTheRecoveryIsAudited(database) {
  const entries = database
    .prepare("SELECT actor_id AS actor, detail FROM audit_logs WHERE action = 'passport_recovered'")
    .all();

  check(
    "the recovery is in the audit log, by email and without an agent (RF-70)",
    entries.length === 1 && entries[0].actor === null && JSON.parse(entries[0].detail).channel === "email",
    JSON.stringify(entries),
  );
}

async function checkTheLinkOnlyWorksOnce(page, link, screenshots) {
  await page.goto(link, { waitUntil: "networkidle" });
  await page.waitForURL(/\/passport\/recover\/expired$/, { timeout: UI_TIMEOUT_MS });
  await page.getByRole("heading", { name: "Este enlace ya no sirve" }).waitFor({ timeout: UI_TIMEOUT_MS });
  await page.screenshot({ path: path.join(screenshots, "email-recovery-expired.png"), fullPage: true });

  const cookies = await page.context().cookies();

  check("the same link opened again lands on the expired-link page", page.url().endsWith("/passport/recover/expired"));
  check("and leaves no device cookie", !cookies.some((cookie) => cookie.name === "ut_visitor_device"));
}

// One request was made; three more reach four in the hour, and only the first three send an email (RF-68).
async function checkHourlyLimit(page, database) {
  await page.goto(`${BASE_URL}/passport/recover`, { waitUntil: "networkidle" });

  const messages = [];

  for (let request = 0; request < 3; request++) {
    await page.reload({ waitUntil: "networkidle" });
    messages.push(await requestLink(page, EMAIL));
  }

  await waitForRecoveryEmails(database, 3);
  await delay(2000);

  check("the fourth request in the hour shows the same message", new Set(messages).size === 1);
  check("and only three recovery emails were queued", recoveryEmails(database).length === 3);
}

async function waitForRecoveryEmails(database, expected) {
  const deadline = Date.now() + UI_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const rows = recoveryEmails(database);

    if (rows.length >= expected) return rows;

    await delay(250);
  }

  throw new Error(`Expected ${expected} recovery emails in email_outbox`);
}

function recoveryEmails(database) {
  return database
    .prepare("SELECT to_address, text FROM email_outbox WHERE subject = ? ORDER BY created_at")
    .all(RECOVERY_SUBJECT);
}

async function hasNoHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
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

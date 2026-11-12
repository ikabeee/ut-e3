// End-to-end check of the recovery desk with real browsers: npm run test:e2e:support
//
// A visitor registers on one phone; the help desk recovers the passport at /support/recovery and the new phone opens
// the link. The first phone loses access, and a stand account is sent back to its own kiosk.
// Creates its own SQLite database in the system temp dir, seeds it (db:seed, db:seed:stands and db:seed:support),
// starts `next dev` on E2E_PORT and removes everything when it finishes. The checks read the database to confirm what
// was recorded.
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
import { encode } from "uqr";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const NEXT_CLI = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

const PORT = Number(process.env.E2E_PORT ?? 3462);

const BASE_URL = `http://localhost:${PORT}`;

const HELP_DESK_EMAIL = "help-desk@ejemplo.com";

const HELP_DESK_PASSWORD = "support-dev-password";

const STAFF_EMAIL = "staff-za-s1@ejemplo.com";

const STAFF_PASSWORD = "stand-dev-password";

const FULL_NAME = "E2E Neo";

const GAMERTAG = "e2e_neo";

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
  const workdir = mkdtempSync(path.join(tmpdir(), "ut-e3-e2e-support-"));
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
    // Closed port: the mail outbox keeps the passport email and retries, as in production.
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "1",
    SMTP_USER: "e2e",
    SMTP_PASSWORD: "e2e",
    SMTP_FROM: "e2e@example.test",
    SYSADMIN_EMAIL: "sysadmin@example.test",
    SYSADMIN_NAME: "Sysadmin",
    SYSADMIN_PASSWORD: "E2e-Sysadmin-2026!",
    STAND_DEV_PASSWORD: STAFF_PASSWORD,
    SUPPORT_DEV_PASSWORD: HELP_DESK_PASSWORD,
  };
}

// db:seed:stands also opens the registration of passports, which the event settings keep closed until November 13.
function prepareDatabase(env) {
  runNpmScript("db:deploy", env);
  runNpmScript("db:seed", env);
  runNpmScript("db:seed:stands", env);
  runNpmScript("db:seed:support", env);
}

// npm sets npm_execpath when it runs this script (`npm run test:e2e:support`), so the same npm CLI runs the seeds.
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
    oldPhone: await browser.newContext({ viewport: { width: 360, height: 740 } }),
    newPhone: await browser.newContext({ viewport: { width: 360, height: 740 } }),
    desk: await browser.newContext({ viewport: { width: 1024, height: 768 } }),
    stand: await browser.newContext({ viewport: { width: 1024, height: 768 } }),
    walkIn: await browser.newContext({ viewport: { width: 360, height: 740 } }),
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
    await checkDeskNeedsLogin(pages.desk);
    const pin = await registerVisitor(pages.oldPhone);

    await loginAs(pages.desk, { email: HELP_DESK_EMAIL, password: HELP_DESK_PASSWORD }, /\/support\/recovery$/);
    await checkWrongIdentity(pages.desk, database);

    const link = await recoverPassport(pages.desk, database, screenshots);

    await checkNewPhoneOpensTheLink(pages.newPhone, link, pin);
    await checkOldPhoneLostAccess(pages.oldPhone);
    await checkAssistedRegistration({ desk: pages.desk, walkIn: pages.walkIn, database, screenshots });
    await checkStandAccountIsRedirected(pages.stand);
  } finally {
    check("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");

    for (const context of Object.values(contexts)) await context.close();
    database.close();
  }
}

async function checkDeskNeedsLogin(page) {
  await page.goto(`${BASE_URL}/support/recovery`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/login/, { timeout: UI_TIMEOUT_MS });
  check("recovery desk without a session -> /login", /\/login/.test(page.url()), page.url());
}

async function registerVisitor(page) {
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Nombre completo").fill(FULL_NAME);
  await page.getByLabel("Gamertag").fill(GAMERTAG);
  await page.getByLabel("Correo electrónico").fill("e2e-neo@example.test");
  await page.getByRole("button", { name: "Registrar pasaporte" }).click();
  await page.waitForURL(/\/passport$/, { timeout: 30_000 });

  const pin = (await page.locator("p.type-mono").first().textContent()).trim();
  check("visitor registers on the first phone and gets a five-digit PIN", /^\d{5}$/.test(pin), pin);

  return pin;
}

async function loginAs(page, { email, password }, landing) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(landing, { timeout: UI_TIMEOUT_MS });
  check(`${email} signs in and lands on ${landing}`, true, page.url());
}

async function checkWrongIdentity(page, database) {
  await fillIdentity(page, "Otra Persona", GAMERTAG);
  // The route announcer of Next is also an alert, so the message is looked up by its own element.
  const alert = page.locator("p[role=alert]");

  await alert.waitFor({ timeout: UI_TIMEOUT_MS });

  const message = await alert.textContent();

  check("a wrong name is refused with the generic message", message.includes("no coinciden con ningún pasaporte"));
  check("and nothing was issued", count(database, "audit_logs", "action = 'passport_recovered'") === 0);
  check("the failed attempt is audited", count(database, "audit_logs", "action = 'passport_recovery_failed'") === 1);
}

async function recoverPassport(page, database, screenshots) {
  await fillIdentity(page, FULL_NAME, GAMERTAG);
  await page.getByRole("heading", { name: "Pasaporte recuperado" }).waitFor({ timeout: UI_TIMEOUT_MS });

  const link = await page.getByLabel("Enlace de acceso").inputValue();
  const agent = database.prepare("SELECT id FROM accounts WHERE email = ?").get(HELP_DESK_EMAIL);
  const entry = database.prepare("SELECT actor_id AS actor FROM audit_logs WHERE action = 'passport_recovered'").all();

  await checkQrEncodesTheLink(page, link);
  await page.screenshot({ path: path.join(screenshots, "support-recovered.png"), fullPage: true });
  check("the desk shows an access link for the visitor", link.startsWith(`${BASE_URL}/passport/claim/`), link);
  check("the recovery is audited with the agent", entry.length === 1 && entry[0].actor === agent.id);
  check("the page does not show a token hash", !/[0-9a-f]{64}/.test(await page.locator("body").innerText()));

  return link;
}

// The QR code is drawn in the page: its modules are read back from the SVG and compared with an encoder run on the link.
async function checkQrEncodesTheLink(page, link) {
  const qr = page.getByRole("img", { name: "Código QR para abrir el pasaporte" });
  const box = await qr.boundingBox();

  const drawn = await qr.evaluate((svg) => ({
    size: Number(svg.getAttribute("data-qr-modules")),
    path: svg.querySelector("path").getAttribute("d"),
    fill: getComputedStyle(svg.querySelector("rect")).fill,
    ink: getComputedStyle(svg.querySelector("path")).fill,
  }));

  const expected = encode(link, { ecc: "M", border: 0 });
  const matches = readModules(drawn) === expectedModules(expected);
  const requests = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));

  check(
    "the recovery screen shows a QR code with the alternative text Código QR para abrir el pasaporte",
    box !== null,
  );
  check(
    "the QR code is big enough to scan from a screen",
    box.width >= 240 && box.height >= 240,
    `${box.width}x${box.height}`,
  );
  check(
    "its modules are dark on a light background",
    drawn.fill === "rgb(255, 255, 255)" && drawn.ink === "rgb(0, 0, 0)",
  );
  check("the QR code encodes exactly the same link as the text field", matches);
  check(
    "the link did not go to any other site",
    requests.every((name) => name.startsWith(BASE_URL)),
  );
  check("the Copiar enlace button is there", await page.getByRole("button", { name: "Copiar enlace" }).isVisible());
}

// The dark modules of the drawn path, one "x,y" per module, with the 4 modules of quiet zone removed.
function readModules({ path: drawnPath }) {
  const modules = [];

  for (const run of drawnPath.matchAll(/M(\d+),(\d+)h(\d+)v1h-\d+z/g)) {
    for (let offset = 0; offset < Number(run[3]); offset += 1) {
      modules.push(`${Number(run[1]) - 4 + offset},${Number(run[2]) - 4}`);
    }
  }

  return modules.sort().join(" ");
}

function expectedModules({ data }) {
  const modules = [];

  data.forEach((row, y) => row.forEach((isDark, x) => isDark && modules.push(`${x},${y}`)));

  return modules.sort().join(" ");
}

async function checkNewPhoneOpensTheLink(page, link, pin) {
  await page.goto(link, { waitUntil: "networkidle" });
  await page.waitForURL(/\/passport$/, { timeout: UI_TIMEOUT_MS });

  const shown = (await page.locator("p.type-mono").first().textContent()).trim();

  check("the new phone opens the link and sees the same passport", shown === pin, shown);
}

async function checkOldPhoneLostAccess(page) {
  await page.goto(`${BASE_URL}/passport`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/register$/, { timeout: UI_TIMEOUT_MS });
  check("the previous phone lost access -> /register", page.url().endsWith("/register"), page.url());
}

async function checkStandAccountIsRedirected(page) {
  await loginAs(page, { email: STAFF_EMAIL, password: STAFF_PASSWORD }, /\/stand\/kiosk$/);
  await page.goto(`${BASE_URL}/support/recovery`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/stand\/kiosk$/, { timeout: UI_TIMEOUT_MS });
  check("a stand staff account is sent back to its kiosk", page.url().endsWith("/stand/kiosk"), page.url());
}

async function fillIdentity(page, fullName, gamertag) {
  const form = deskForm(page, "Confirma la identidad del visitante");

  await form.getByLabel("Nombre completo").fill(fullName);
  await form.getByLabel("Gamertag").fill(gamertag);
  await form.getByRole("button", { name: "Recuperar pasaporte" }).click();
}

// The page holds two forms with the same labels: each one is found by its heading.
function deskForm(page, heading) {
  return page.locator("form", { has: page.getByRole("heading", { name: heading }) });
}

// A visitor that arrives without a passport is registered at the desk: the agent gets the PIN and the link, the phone
// of the visitor opens it, and the KOF option only exists during the on-site sign-up (RF-58).
async function checkAssistedRegistration({ desk, walkIn, database, screenshots }) {
  const agent = database.prepare("SELECT id FROM accounts WHERE email = ?").get(HELP_DESK_EMAIL);

  await desk.goto(`${BASE_URL}/support/recovery`, { waitUntil: "networkidle" });
  check(
    "the KOF option is hidden outside the on-site sign-up",
    (await desk.getByText("Inscribir también en el torneo de KOF").count()) === 0,
  );

  const pin = await registerAtDesk(desk, { gamertag: "desk_walkin", email: "e2e-walkin@example.test" });

  const visitor = database.prepare("SELECT id FROM visitors WHERE gamertag = 'desk_walkin'").get();

  const audit = database
    .prepare("SELECT actor_id AS actor FROM audit_logs WHERE action = 'visitor.register' AND entity_id = ?")
    .all(visitor.id);

  check("the desk shows a five-digit PIN for the new visitor", /^\d{5}$/.test(pin), pin);
  check("the registration is audited with the agent", audit.length === 1 && audit[0].actor === agent.id);
  check("no tournament entry was created", count(database, "tournament_entries") === 0);
  await desk.screenshot({ path: path.join(screenshots, "support-registered.png"), fullPage: true });

  const link = await desk.getByLabel("Enlace de acceso").inputValue();

  await walkIn.goto(link, { waitUntil: "networkidle" });
  await walkIn.waitForURL(/\/passport$/, { timeout: UI_TIMEOUT_MS });
  check(
    "the phone of the visitor opens the link and sees the same PIN",
    (await walkIn.locator("p.type-mono").first().textContent()).trim() === pin,
  );

  await checkAssistedRegistrationRefusals(desk);
  await checkAssistedRegistrationInTournament({ desk, database });
}

async function checkAssistedRegistrationRefusals(page) {
  await page.goto(`${BASE_URL}/support/recovery`, { waitUntil: "networkidle" });

  const form = deskForm(page, "Registrar visitante");

  await fillRegistration(form, { gamertag: "desk_walkin", email: "otro-walkin@example.test" });
  await form.getByText("Ese gamertag ya está registrado.").waitFor({ timeout: UI_TIMEOUT_MS });
  check("a taken gamertag is named in the form", true);

  await fillRegistration(form, { gamertag: "desk_other", email: "e2e-walkin@example.test" });
  await form
    .locator("p[role=alert]")
    .getByText("No se pudo registrar este correo.")
    .waitFor({ timeout: UI_TIMEOUT_MS });
  check("a used email is refused with the generic message", true);
}

async function checkAssistedRegistrationInTournament({ desk, database }) {
  const now = Date.now();

  const { current } = database
    .prepare("SELECT kof_onsite_signup_starts_at AS current FROM event_settings WHERE id = 1")
    .get();

  const stored = (milliseconds) =>
    /^\d+$/.test(String(current)) ? milliseconds : new Date(milliseconds).toISOString();

  database
    .prepare(
      "UPDATE event_settings SET kof_registration_opens_at = ?, kof_onsite_signup_starts_at = ?, kof_onsite_signup_ends_at = ? WHERE id = 1",
    )
    .run(stored(now - 2 * 3600_000), stored(now - 3600_000), stored(now + 3600_000));

  await desk.goto(`${BASE_URL}/support/recovery`, { waitUntil: "networkidle" });
  await desk.getByText("Inscribir también en el torneo de KOF").click();

  const pin = await registerAtDesk(desk, { gamertag: "desk_kof", email: "e2e-kof@example.test" });

  const entry = database
    .prepare(
      "SELECT e.channel AS channel, e.status AS status FROM tournament_entries e JOIN visitors v ON v.id = e.visitor_id WHERE v.gamertag = 'desk_kof'",
    )
    .get();

  check("the second visitor also gets a PIN", /^\d{5}$/.test(pin), pin);
  check(
    "and enters the tournament on site, already checked in",
    entry?.channel === "onsite" && entry?.status === "checked_in",
  );
  check("the desk says so", await desk.getByText("También quedó inscrito en el torneo de KOF.").isVisible());
}

async function registerAtDesk(page, { gamertag, email }) {
  const form = deskForm(page, "Registrar visitante");

  await fillRegistration(form, { gamertag, email });

  await page.getByRole("heading", { name: "Pasaporte creado" }).waitFor({ timeout: UI_TIMEOUT_MS });

  return (await page.getByTestId("desk-pin").textContent()).trim();
}

async function fillRegistration(form, { gamertag, email }) {
  await form.getByLabel("Nombre completo").fill("Visitante de mesa");
  await form.getByLabel("Gamertag").fill(gamertag);
  await form.getByLabel("Correo").fill(email);
  await form.getByRole("button", { name: "Registrar visitante" }).click();
}

function count(database, table, where = "1 = 1") {
  return database.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`).get().n;
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

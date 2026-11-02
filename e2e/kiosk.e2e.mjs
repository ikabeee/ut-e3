// End-to-end check of the stand kiosk with two real browsers at once: npm run test:e2e:kiosk
//
// The staff logs in to /stand/kiosk on a tablet-sized window and a visitor keeps /passport open on a phone-sized one.
// Creates its own SQLite database in the system temp dir, seeds it (db:seed and db:seed:stands), starts `next dev` on
// E2E_PORT and removes everything when it finishes. The checks read the database to confirm what was recorded.
//
// Browser: set E2E_CHROMIUM_PATH to an installed Chromium, or run `npx playwright-core install chromium`
// (https://playwright.dev/docs/browsers) and leave it unset. Screenshots go to e2e/screenshots (not versioned;
// override with E2E_SCREENSHOTS_DIR). E2E_KEEP_FILES=1 keeps the database and the server log; they are also kept
// when a check fails. The visit cutoff of the seed is November 20, 2026: after that date the kiosk refuses visits.
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

const PORT = Number(process.env.E2E_PORT ?? 3461);

const BASE_URL = `http://localhost:${PORT}`;

const STAFF_EMAIL = "staff-za-s1@ejemplo.com";

const STAFF_PASSWORD = "stand-dev-password";

const GAMERTAG = "e2e_neo";

const SERVER_READY_TIMEOUT_MS = 180_000;

const UI_TIMEOUT_MS = 20_000;

const SUBMIT = "Enviar y registrar mi visita";

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
  const workdir = mkdtempSync(path.join(tmpdir(), "ut-e3-e2e-kiosk-"));
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
  };
}

// db:seed:stands also opens the registration of passports, which the event settings keep closed until November 13.
function prepareDatabase(env) {
  runNpmScript("db:deploy", env);
  runNpmScript("db:seed", env);
  runNpmScript("db:seed:stands", env);
}

// npm sets npm_execpath when it runs this script (`npm run test:e2e:kiosk`), so the same npm CLI runs the seeds.
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
  const phone = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const tablet = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const visitorPage = await phone.newPage();
  const staffPage = await tablet.newPage();

  for (const page of [visitorPage, staffPage]) {
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  }

  try {
    await checkKioskNeedsLogin(staffPage);
    await loginAsStaff(staffPage);
    const pin = await registerVisitor(visitorPage);

    await checkRefusedPins(staffPage);
    await checkVisitRatedOnThePhone({ visitorPage, staffPage, database, screenshots }, pin);
    await checkSecondVisitRefused(staffPage, pin);
    await checkCancelledVisit(staffPage, visitorPage, database);
    await checkVisitRatedOnTheKiosk(staffPage, database);
    await checkMilestoneTicket(staffPage, database);
    await checkStaffCannotOpenAdmin(staffPage);
  } finally {
    check("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");
    await phone.close();
    await tablet.close();
    database.close();
  }
}

async function checkKioskNeedsLogin(page) {
  await page.goto(`${BASE_URL}/stand/kiosk`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/login/, { timeout: UI_TIMEOUT_MS });
  check("kiosk without a session -> /login", /\/login/.test(page.url()), page.url());
}

async function loginAsStaff(page) {
  await page.getByLabel("Correo").fill(STAFF_EMAIL);
  await page.getByLabel("Contraseña").fill(STAFF_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/stand\/kiosk$/, { timeout: UI_TIMEOUT_MS });
  await page.getByRole("heading", { name: "Escribe tu PIN" }).waitFor({ timeout: UI_TIMEOUT_MS });
  check("staff login -> /stand/kiosk with the PIN screen", true, page.url());
}

async function registerVisitor(page) {
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Nombre completo").fill("E2E Neo");
  await page.getByLabel("Gamertag").fill(GAMERTAG);
  await page.getByLabel("Correo electrónico").fill("e2e-neo@example.test");
  await page.getByRole("button", { name: "Registrar pasaporte" }).click();
  await page.waitForURL(/\/passport$/, { timeout: 30_000 });

  const pin = (await page.locator("p.type-mono").first().textContent()).trim();
  check("visitor registers and gets a five-digit PIN", /^\d{5}$/.test(pin), pin);

  return pin;
}

async function checkRefusedPins(staffPage) {
  for (const [value, message] of [
    ["99999", "PIN no reconocido, revísalo"],
    ["123", "El PIN tiene 5 dígitos."],
  ]) {
    await typePin(staffPage, value);
    await staffPage.getByText(message).waitFor({ timeout: UI_TIMEOUT_MS });
    check(`PIN ${value} is refused with "${message}"`, true);
    await staffPage.getByLabel("PIN de 5 dígitos").fill("");
  }
}

// The staff types the PIN, the passport of the visitor opens the survey, the visitor answers and both screens finish.
async function checkVisitRatedOnThePhone(session, pin) {
  const { visitorPage, staffPage, database, screenshots } = session;

  await typePin(staffPage, pin);
  await staffPage.getByRole("heading", { name: "Esperando la calificación" }).waitFor({ timeout: UI_TIMEOUT_MS });
  check("staff types the PIN -> the kiosk waits for the visitor", true);
  check("a visit is waiting in the database", count(database, "pending_visits") === 1);

  const dialog = visitorPage.getByRole("dialog");

  await dialog.waitFor({ timeout: UI_TIMEOUT_MS });
  check("the passport opens the survey of the stand", (await dialog.textContent()).includes("ZA-S1"));
  await visitorPage.screenshot({ path: path.join(screenshots, "kiosk-phone-survey.png"), fullPage: true });

  await answerSurveyOnThePhone(dialog, database);
  await checkKioskFinished(staffPage);
  await checkVoteRecorded(database);

  await visitorPage.reload({ waitUntil: "networkidle" });
  const summary = (await visitorPage.getByText(/^Visitados \d+ de 18$/).textContent()).trim();

  check("the passport shows the new visit", summary === "Visitados 1 de 18", summary);
}

async function answerSurveyOnThePhone(dialog, database) {
  await dialog.getByRole("button", { name: SUBMIT }).click();
  check(
    "the survey does not send without the three answers",
    count(database, "checkins", "scanned_by_id IS NOT NULL") === 0,
  );

  await rate(dialog, "El juego", "5");
  await rate(dialog, "El stand", "4");
  await rate(dialog, "El arte", "3");
  await dialog.getByRole("button", { name: SUBMIT }).click();
  await dialog.getByText("Tu visita quedó registrada").waitFor({ timeout: UI_TIMEOUT_MS });
  check("the visitor sees the thanks", true);
}

async function checkKioskFinished(staffPage) {
  await staffPage.getByRole("heading", { name: "¡Gracias!" }).waitFor({ timeout: UI_TIMEOUT_MS });
  check(
    "the kiosk shows only the thanks, never the ratings",
    !(await staffPage.locator("body").textContent()).includes("Califica"),
  );
  await staffPage.getByRole("heading", { name: "Escribe tu PIN" }).waitFor({ timeout: UI_TIMEOUT_MS });
  check("the kiosk goes back to the PIN screen by itself", true);
}

async function checkVoteRecorded(database) {
  const vote = database
    .prepare(
      "SELECT v.game_rating AS g, v.stand_rating AS s, v.art_rating AS a, c.scanned_by_id AS by FROM votes v JOIN checkins c ON c.id = v.check_in_id JOIN visitors x ON x.id = v.visitor_id WHERE x.gamertag = ?",
    )
    .get(GAMERTAG);

  const staff = database.prepare("SELECT id FROM accounts WHERE email = ?").get(STAFF_EMAIL);

  check(
    "visit, ratings 5/4/3 and the staff account are recorded together",
    vote?.g === 5 && vote.s === 4 && vote.a === 3 && vote.by === staff.id,
    JSON.stringify(vote),
  );
  check(
    "the answered visit is marked, not left waiting",
    count(database, "pending_visits", "answered_at IS NULL") === 0,
  );
}

async function checkSecondVisitRefused(staffPage, pin) {
  await typePin(staffPage, pin);
  await staffPage.getByText("Este PIN ya registró su visita a este stand.").waitFor({ timeout: UI_TIMEOUT_MS });
  check("the same passport cannot visit the stand twice", true);
  await staffPage.getByLabel("PIN de 5 dígitos").fill("");
}

async function checkCancelledVisit(staffPage, visitorPage, database) {
  await typePin(staffPage, "10003");
  await staffPage.getByRole("heading", { name: "Esperando la calificación" }).waitFor({ timeout: UI_TIMEOUT_MS });
  await staffPage.getByRole("button", { name: "Cancelar" }).click();
  await staffPage.getByRole("heading", { name: "Escribe tu PIN" }).waitFor({ timeout: UI_TIMEOUT_MS });
  check("cancelling returns to the PIN screen", true);
  check("a cancelled visit leaves nothing waiting", count(database, "pending_visits", "answered_at IS NULL") === 0);
  check("and records nothing", count(database, "checkins", "scanned_by_id IS NOT NULL") === 1);
  check("the phone of the visitor shows no survey", (await visitorPage.getByRole("dialog").count()) === 0);
}

// The fallback of the kiosk: the visitor rates on the tablet when the phone has no signal.
async function checkVisitRatedOnTheKiosk(staffPage, database) {
  await typePin(staffPage, "10002");
  await staffPage.getByRole("button", { name: "Calificar en esta pantalla" }).click();
  await staffPage.getByRole("heading", { name: "¿Qué te pareció?" }).waitFor({ timeout: UI_TIMEOUT_MS });
  await rate(staffPage, "El juego", "2");
  await rate(staffPage, "El stand", "3");
  await rate(staffPage, "El arte", "4");
  await staffPage.getByRole("button", { name: SUBMIT }).click();
  await staffPage.getByRole("heading", { name: "¡Gracias!" }).waitFor({ timeout: UI_TIMEOUT_MS });
  await staffPage.getByRole("heading", { name: "Escribe tu PIN" }).waitFor({ timeout: UI_TIMEOUT_MS });
  check("rating on the kiosk records the visit", count(database, "checkins", "scanned_by_id IS NOT NULL") === 2);
  check("and leaves nothing waiting", count(database, "pending_visits", "answered_at IS NULL") === 0);
}

// The seed leaves the PIN 10001 with 8 visits: the one at ZA-S1 is the ninth and grants the first ticket (RF-22).
async function checkMilestoneTicket(staffPage, database) {
  await typePin(staffPage, "10001");
  await staffPage.getByRole("button", { name: "Calificar en esta pantalla" }).click();
  await rate(staffPage, "El juego", "5");
  await rate(staffPage, "El stand", "5");
  await rate(staffPage, "El arte", "5");
  await staffPage.getByRole("button", { name: SUBMIT }).click();
  await staffPage.getByRole("heading", { name: "¡Gracias!" }).waitFor({ timeout: UI_TIMEOUT_MS });

  const tickets = database
    .prepare(
      "SELECT t.milestone AS milestone FROM raffle_tickets t JOIN visitors v ON v.id = t.visitor_id WHERE v.gamertag = ?",
    )
    .all("Visitante10001");

  check(
    "the ninth visit grants the first ticket in the same commit",
    tickets.length === 1 && tickets[0].milestone === 9,
    JSON.stringify(tickets),
  );
}

async function checkStaffCannotOpenAdmin(page) {
  await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
  check("a stand account does not get the sysadmin panel", !page.url().endsWith("/admin"), page.url());
}

async function typePin(page, pin) {
  await page.getByLabel("PIN de 5 dígitos").fill(pin);
  await page.getByRole("button", { name: "Continuar" }).click();
}

async function rate(scope, question, value) {
  await scope
    .getByRole("group", { name: question })
    .locator("label")
    .filter({ hasText: new RegExp(`^${value}$`) })
    .click();
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

// End-to-end check of the administration of the stands with real browsers: npm run test:e2e:stand-admin
//
// The sysadmin creates two stands, each with the invitation of its administrator (RF-39). Each administrator activates
// the account from the email link, registers the game of the stand (RF-31) and invites staff (RF-32). The checks cover
// that an administrator only reaches the game of its own stand, that a stand holds 3 staff accounts at most, and that
// a disabled account loses its session and cannot sign in again.
// Creates its own SQLite database in the system temp dir, seeds it (db:seed), frees two stand places, starts `next dev`
// on E2E_PORT and removes everything when it finishes. The checks read the database to confirm what was recorded.
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

const PORT = Number(process.env.E2E_PORT ?? 3463);

const BASE_URL = `http://localhost:${PORT}`;

const SYSADMIN = { email: "sysadmin@example.test", password: "E2e-Sysadmin-2026!" };

const PASSWORD = "E2e-Stand-Pass-2026";

const ADMIN_ONE = { name: "Admin Uno", email: "admin-uno@example.test", password: PASSWORD };

const ADMIN_TWO = { name: "Admin Dos", email: "admin-dos@example.test", password: PASSWORD };

const STAFF_EMAILS = ["staff-uno@example.test", "staff-dos@example.test", "staff-tres@example.test"];

const FOURTH_STAFF_EMAIL = "staff-cuatro@example.test";

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
  const workdir = mkdtempSync(path.join(tmpdir(), "ut-e3-e2e-stand-admin-"));
  const screenshots = process.env.E2E_SCREENSHOTS_DIR ?? path.join(ROOT, "e2e", "screenshots");
  mkdirSync(screenshots, { recursive: true });

  const env = buildEnvironment(workdir);
  const databaseFile = path.join(workdir, "e2e.db");
  prepareDatabase({ env, databaseFile });

  const server = startDevServer(env, path.join(workdir, "dev.log"));
  let browser;

  try {
    await waitForServer();
    browser = await launchBrowser();
    await runScenario({ browser, databaseFile, screenshots });
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
    // Closed port: the mail outbox keeps the invitations and retries, as in production. The links are read from it.
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "1",
    SMTP_USER: "e2e",
    SMTP_PASSWORD: "e2e",
    SMTP_FROM: "e2e@example.test",
    SYSADMIN_EMAIL: SYSADMIN.email,
    SYSADMIN_NAME: "Sysadmin",
    SYSADMIN_PASSWORD: SYSADMIN.password,
  };
}

// The seed fills the 18 places of the event, so the zone A stands 1 and 2 are removed to create them from the panel.
function prepareDatabase({ env, databaseFile }) {
  runNpmScript("db:deploy", env);
  runNpmScript("db:seed", env);
  freeStandPlaces(databaseFile);
}

// npm sets npm_execpath when it runs this script (`npm run test:e2e:stand-admin`), so the same npm CLI runs the seeds.
function runNpmScript(name, env) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, "run", name], { env, stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`npm run ${name} failed with exit code ${result.status}`);
  }
}

function freeStandPlaces(databaseFile) {
  const database = new DatabaseSync(databaseFile);
  const places = "(SELECT id FROM stands WHERE zone = 'A' AND number IN (1, 2))";

  database.exec(`DELETE FROM game_images WHERE game_id IN (SELECT id FROM games WHERE stand_id IN ${places})`);
  database.exec(`DELETE FROM games WHERE stand_id IN ${places}`);
  database.exec("DELETE FROM stands WHERE zone = 'A' AND number IN (1, 2)");
  database.close();
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
      const response = await fetch(`${BASE_URL}/login`, { redirect: "manual" });

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

async function runScenario({ browser, databaseFile, screenshots }) {
  const database = new DatabaseSync(databaseFile);
  const consoleErrors = [];
  const pages = {};

  for (const name of ["sysadmin", "adminOne", "adminTwo", "staff"]) {
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });

    pages[name] = await context.newPage();
    pages[name].on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    pages[name].on("pageerror", (error) => consoleErrors.push(String(error)));
  }

  try {
    await runSteps({ pages, database, screenshots });
  } finally {
    check("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");

    for (const page of Object.values(pages)) await page.context().close();
    database.close();
  }
}

async function runSteps({ pages, database, screenshots }) {
  await signInSysadminAndCreateStands({ page: pages.sysadmin, database, screenshots });
  await activateAdmins({ pages, database });
  await registerGames({ pages, database, screenshots });
  await checkAdminsOnlyReachTheirOwnGame({ pages, database });
  await inviteStaff({ page: pages.adminOne, database, screenshots });
  await checkStaffSessionEndsWhenDisabled({ pages, database });
}

async function signInSysadminAndCreateStands({ page, database, screenshots }) {
  await signIn(page, SYSADMIN);
  await page.waitForURL(/\/admin$/, { timeout: UI_TIMEOUT_MS });
  check("the sysadmin signs in to /admin", true, page.url());

  await createStand({ page, number: "1", admin: ADMIN_ONE });
  await createStand({ page, number: "2", admin: ADMIN_TWO });

  const stand = database
    .prepare("SELECT id, studio, group_code AS groupCode FROM stands WHERE zone = 'A' AND number = 1")
    .get();

  const account = database
    .prepare("SELECT role, status, stand_id AS standId FROM accounts WHERE email = ?")
    .get(ADMIN_ONE.email);

  const audit = database
    .prepare("SELECT action FROM audit_logs WHERE entity_id = ? ORDER BY created_at")
    .all(stand?.id ?? "");

  check("the stand has the studio and the group of the form", stand?.studio === 6 && stand?.groupCode === "101");
  check(
    "its administrator is invited and belongs to that stand",
    account?.role === "stand_admin" && account.status === "invited" && account.standId === stand.id,
  );
  check(
    "creating the stand left an audit entry",
    audit.some((entry) => entry.action === "stand.create"),
  );

  await page.reload({ waitUntil: "networkidle" });
  check(
    "the panel shows the full code of the stand",
    (await page.locator("body").innerText()).includes("ZA-S1-E6-101"),
  );
  await page.screenshot({ path: path.join(screenshots, "stand-admin-panel.png"), fullPage: true, caret: "initial" });
}

async function createStand({ page, number, admin }) {
  const form = page.locator("section[aria-labelledby=stands-admin] > details").first();

  if (!(await form.evaluate((element) => element.open))) await form.locator("summary").click();

  await form.getByLabel("Número de stand").fill(number);
  await form.getByLabel("Estudio").fill("6");
  await form.getByLabel("Grupo").fill("101");
  await form.getByLabel("Nombre del administrador").fill(admin.name);
  await form.getByLabel("Correo del administrador").fill(admin.email);
  await form.getByRole("button", { name: "Crear stand e invitar al administrador" }).click();
  await form.getByText("Stand creado.").waitFor({ timeout: UI_TIMEOUT_MS });
  check(`the sysadmin creates the stand ${number} with the invitation of ${admin.email}`, true);
}

async function activateAdmins({ pages, database }) {
  await activateAndSignIn({ page: pages.adminOne, database, account: ADMIN_ONE });
  await activateAndSignIn({ page: pages.adminTwo, database, account: ADMIN_TWO });
  check("an administrator lands on its kiosk", pages.adminOne.url().endsWith("/stand/kiosk"), pages.adminOne.url());
}

async function registerGames({ pages, database, screenshots }) {
  await registerGame({ page: pages.adminOne, name: "Juego Uno" });
  await registerGame({ page: pages.adminTwo, name: "Juego Dos" });
  await pages.adminOne.screenshot({
    path: path.join(screenshots, "stand-admin-game.png"),
    fullPage: true,
    caret: "initial",
  });

  const game = database
    .prepare(
      "SELECT g.name, i.path, i.is_cover AS isCover FROM games g JOIN game_images i ON i.game_id = g.id WHERE g.name = 'Juego Uno'",
    )
    .get();

  const owner = database
    .prepare("SELECT s.zone, s.number FROM games g JOIN stands s ON s.id = g.stand_id WHERE g.name = 'Juego Uno'")
    .get();

  check("the administrator registers the game of its stand", owner?.zone === "A" && owner.number === 1);
  check("a new game gets the generic cover", game?.path === "/games/generic-cover.jpg" && game.isCover === 1);
  check("the registration left an audit entry", count(database, "audit_logs", "action = 'game.create'") === 2);
}

async function registerGame({ page, name }) {
  await page.goto(`${BASE_URL}/stand/game`, { waitUntil: "networkidle" });
  await page.getByLabel("Nombre del juego").fill(name);
  await page.getByLabel("Sinopsis").fill(`Sinopsis de ${name}.`);
  await page.getByRole("button", { name: "Guardar juego" }).click();
  await page.getByText("Juego registrado.").waitFor({ timeout: UI_TIMEOUT_MS });
}

async function checkAdminsOnlyReachTheirOwnGame({ pages, database }) {
  const page = pages.adminTwo;

  await page.goto(`${BASE_URL}/stand/game`, { waitUntil: "networkidle" });
  check(
    "an administrator sees the game of its own stand",
    (await page.getByLabel("Nombre del juego").inputValue()) === "Juego Dos",
  );

  await page.getByLabel("Nombre del juego").fill("Juego Dos editado");
  await page.getByRole("button", { name: "Guardar juego" }).click();
  await page.getByText("Juego actualizado.").waitFor({ timeout: UI_TIMEOUT_MS });

  const names = database.prepare("SELECT name FROM games WHERE name LIKE 'Juego%' ORDER BY name").all();

  check(
    "editing the game of one stand does not change the game of another",
    names.map((game) => game.name).join("|") === "Juego Dos editado|Juego Uno",
    names.map((game) => game.name).join("|"),
  );
}

async function inviteStaff({ page, database, screenshots }) {
  await page.goto(`${BASE_URL}/stand/team`, { waitUntil: "networkidle" });
  await page.locator("details", { hasText: "Invitar a alguien" }).first().locator("summary").click();

  for (const email of STAFF_EMAILS) await inviteStaffMember({ page, email });

  await inviteStaffMember({ page, email: FOURTH_STAFF_EMAIL, expected: "El stand ya tiene 3 cuentas de staff" });
  await page.screenshot({ path: path.join(screenshots, "stand-admin-team.png"), fullPage: true, caret: "initial" });

  const staff = database.prepare("SELECT stand_id AS standId FROM accounts WHERE role = 'stand_staff'").all();
  const standId = database.prepare("SELECT id FROM stands WHERE zone = 'A' AND number = 1").get().id;

  check(
    "the administrator invites 3 staff accounts into its stand",
    staff.length === 3 && staff.every((row) => row.standId === standId),
  );
  check("a 4th staff account is refused", count(database, "accounts", `email = '${FOURTH_STAFF_EMAIL}'`) === 0);
}

async function inviteStaffMember({ page, email, expected = "Invitación enviada." }) {
  await page.getByLabel("Nombre", { exact: true }).fill("Staff");
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Enviar invitación", exact: true }).click();
  await page.getByText(expected).first().waitFor({ timeout: UI_TIMEOUT_MS });

  // The list refreshes after the action; the next invitation waits for this one to show up.
  if (expected === "Invitación enviada.") await page.getByText(email).waitFor({ timeout: UI_TIMEOUT_MS });

  check(`inviting ${email} answers "${expected}"`, true);
}

async function checkStaffSessionEndsWhenDisabled({ pages, database }) {
  const staff = { email: STAFF_EMAILS[0], password: PASSWORD, name: "Staff" };

  await activateAndSignIn({ page: pages.staff, database, account: staff });
  await checkStaffOnlyHasTheKiosk(pages.staff);

  await disableStaff({ page: pages.adminOne, email: staff.email });

  const sessions = count(database, "sessions", `account_id = (SELECT id FROM accounts WHERE email = '${staff.email}')`);

  check("disabling the account closes its sessions", sessions === 0, String(sessions));
  check("the disable left an audit entry", count(database, "audit_logs", "action = 'account.disable'") === 1);

  await pages.staff.goto(`${BASE_URL}/stand/kiosk`, { waitUntil: "networkidle" });
  await pages.staff.waitForURL(/\/login/, { timeout: UI_TIMEOUT_MS });
  check("the open session of a disabled account no longer works", /\/login/.test(pages.staff.url()), pages.staff.url());

  await signIn(pages.staff, staff);
  await pages.staff.getByText("Correo o contraseña incorrectos").waitFor({ timeout: UI_TIMEOUT_MS });
  check("a disabled account cannot sign in", true);
}

async function checkStaffOnlyHasTheKiosk(page) {
  await page.goto(`${BASE_URL}/stand/game`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/stand\/kiosk$/, { timeout: UI_TIMEOUT_MS });
  check("the staff of a stand is sent back to the kiosk from the game page", true, page.url());
  check(
    "and the kiosk shows no administration links",
    (await page.getByRole("navigation", { name: "Panel del stand" }).count()) === 0,
  );
}

async function disableStaff({ page, email }) {
  await page.goto(`${BASE_URL}/stand/team`, { waitUntil: "networkidle" });

  const row = page.locator("li", { hasText: email });

  await row.getByRole("button", { name: "Desactivar" }).click();
  await row.getByRole("button", { name: "Sí, desactivar" }).click();
  // The row leaves the form behind and shows the new status.
  await row.getByText("Desactivada").waitFor({ timeout: UI_TIMEOUT_MS });
}

// The password comes from the activation page, reached with the link of the email in the outbox.
async function activateAndSignIn({ page, database, account }) {
  const email = database
    .prepare("SELECT text FROM email_outbox WHERE to_address = ? ORDER BY created_at DESC")
    .get(account.email);

  const link = /https?:\/\/\S+\/activate\/[\w-]+/.exec(email?.text ?? "")?.[0];

  check(`the outbox holds the activation link of ${account.email}`, Boolean(link), link ?? "none");

  await page.goto(link, { waitUntil: "networkidle" });
  await page.getByLabel("Contraseña nueva").fill(account.password);
  await page.getByLabel("Repite la contraseña").fill(account.password);
  await page.getByRole("button", { name: "Activar cuenta" }).click();
  await page.waitForURL(/\/login/, { timeout: UI_TIMEOUT_MS });

  await signIn(page, account);
  await page.waitForURL(/\/stand\/kiosk$/, { timeout: UI_TIMEOUT_MS });
  check(`${account.email} activates the account and signs in`, true, page.url());
}

async function signIn(page, { email, password }) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
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

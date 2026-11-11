// End-to-end check of the tools of the sysadmin in /admin (M7) with real browsers: npm run test:e2e:sysadmin-tools
//
// The sysadmin edits event_settings (RF-43), sees the fraud alerts (RF-45), annuls a visit of a passport with 9 visits
// and its ticket (RF-46, E2E-14), excludes another visitor whose PIN the kiosk then refuses, manages the genres
// (RF-72), registers a sponsor (RF-41), blocks a team email (RF-44), reads the server status, resends an email of the
// outbox (RF-73) and closes the public bracket (RF-74). The checks read the database to confirm what was recorded.
// Creates its own SQLite database in the system temp dir, seeds it (db:seed and db:seed:stands), starts `next dev` on
// E2E_PORT and removes everything when it finishes.
//
// Browser: set E2E_CHROMIUM_PATH to an installed Chromium, or run `npx playwright-core install chromium`
// (https://playwright.dev/docs/browsers) and leave it unset. Screenshots go to e2e/screenshots (not versioned;
// override with E2E_SCREENSHOTS_DIR). E2E_KEEP_FILES=1 keeps the database and the server log; they are also kept
// when a check fails.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, openSync, rmSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const NEXT_CLI = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

const PORT = Number(process.env.E2E_PORT ?? 3531);

const BASE_URL = `http://localhost:${PORT}`;

const SYSADMIN = { email: "sysadmin@example.test", password: "E2e-Sysadmin-2026!" };

const STAFF = { email: "staff-za-s1@ejemplo.com", password: "stand-dev-password" };

const GAMERTAG = "e2e_moderada";

const EXCLUDED_PIN = "10002";

const BLOCKED_EMAIL = "integrante@equipo.example.test";

const SERVER_READY_TIMEOUT_MS = 180_000;

const UI_TIMEOUT_MS = 30_000;

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
  const workdir = mkdtempSync(path.join(tmpdir(), "ut-e3-e2e-sysadmin-tools-"));
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
    // Closed port: the outbox keeps the emails and retries, as in production without SMTP.
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "1",
    SMTP_USER: "e2e",
    SMTP_PASSWORD: "e2e",
    SMTP_FROM: "e2e@example.test",
    SYSADMIN_EMAIL: SYSADMIN.email,
    SYSADMIN_NAME: "Sysadmin",
    SYSADMIN_PASSWORD: SYSADMIN.password,
    STAND_DEV_PASSWORD: STAFF.password,
  };
}

// db:seed:stands adds the staff of each stand, 24 passports (PIN 10001 to 10024) and opens the registration.
function prepareDatabase(env) {
  runNpmScript("db:deploy", env);
  runNpmScript("db:seed", env);
  runNpmScript("db:seed:stands", env);
}

// npm sets npm_execpath when it runs this script (`npm run test:e2e:sysadmin-tools`), so the same npm CLI runs the seeds.
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

  for (const [name, viewport] of [
    ["sysadmin", { width: 1280, height: 900 }],
    ["visitor", { width: 390, height: 844 }],
    ["staff", { width: 1024, height: 768 }],
  ]) {
    const context = await browser.newContext({ viewport });

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
  const page = pages.sysadmin;

  await signIn(page, SYSADMIN);
  await page.waitForURL(/\/admin$/, { timeout: UI_TIMEOUT_MS });
  check("the sysadmin signs in to /admin with the sections of the panel", await hasNav(page));
  await page.screenshot({ path: path.join(screenshots, "sysadmin-tools-01-panel.png"), fullPage: true });

  await editEventSettings({ page, database, screenshots });
  const visitorId = await registerVisitorWithNineVisits({ page: pages.visitor, database });
  insertPerfectVotes(database);
  await checkFraudAlerts({ page, screenshots });
  await annulOneVisit({ pages, database, screenshots, visitorId });
  await excludeVisitor({ pages, database });
  await manageGenres({ page, database });
  await registerSponsor({ page, database, screenshots });
  await blockTeamEmail({ pages, database, screenshots });
  await checkServerStatus({ page, database, screenshots });
  await checkPhoneWidth(pages.visitor);
}

async function hasNav(page) {
  const nav = page.getByRole("navigation", { name: "Secciones del panel" });

  await nav.waitFor({ timeout: UI_TIMEOUT_MS });

  return (await nav.getByRole("link").count()) === 6;
}

// RF-43: a valid change is saved with its audit entry; a cutoff after the raffle is refused and nothing changes.
async function editEventSettings({ page, database, screenshots }) {
  await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: "networkidle" });
  await page.getByLabel("Inicio de la rifa").fill("2026-11-20T18:05");
  await page.getByRole("button", { name: "Guardar valores" }).click();
  await page.getByText("Valores guardados.").waitFor({ timeout: UI_TIMEOUT_MS });

  const saved = database.prepare("SELECT raffle_starts_at AS at FROM event_settings").get();

  check(
    "event_settings keeps the new hour of the raffle (18:05 Cancun)",
    saved.at.startsWith("2026-11-20T23:05"),
    saved.at,
  );
  check("the change left an audit entry", count(database, "audit_logs", "action = 'event_settings.update'") === 1);

  await page.getByLabel("Corte de check-ins").fill("2026-11-20T18:30");
  await page.getByRole("button", { name: "Guardar valores" }).click();
  await page
    .getByText("El corte de check-ins debe ser antes del inicio de la rifa.")
    .waitFor({ timeout: UI_TIMEOUT_MS });

  const cutoff = database.prepare("SELECT check_in_cutoff_at AS at FROM event_settings").get();

  check(
    "a cutoff after the raffle is refused and the row keeps 16:50",
    cutoff.at.startsWith("2026-11-20T21:50"),
    cutoff.at,
  );
  await page.screenshot({ path: path.join(screenshots, "sysadmin-tools-02-settings.png"), fullPage: true });
  await page.getByLabel("Corte de check-ins").fill("2026-11-20T16:50");
}

// A passport registered in the phone, so it has the device cookie, with 9 visits and the ticket of the first milestone.
async function registerVisitorWithNineVisits({ page, database }) {
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Nombre completo").fill("E2E Moderada");
  await page.getByLabel("Gamertag").fill(GAMERTAG);
  await page.getByLabel("Correo electrónico").fill("e2e-moderada@example.test");
  await page.getByRole("button", { name: "Registrar pasaporte" }).click();
  await page.waitForURL(/\/passport$/, { timeout: UI_TIMEOUT_MS });

  const visitor = database.prepare("SELECT id FROM visitors WHERE gamertag = ?").get(GAMERTAG);
  const stands = database.prepare("SELECT id FROM stands ORDER BY zone, number LIMIT 9").all();

  for (const [index, stand] of stands.entries())
    insertVisit(database, { visitorId: visitor.id, standId: stand.id, minute: index });

  database
    .prepare("INSERT INTO raffle_tickets (visitor_id, milestone, status, created_at) VALUES (?, 9, 'active', ?)")
    .run(visitor.id, timestamp(0));

  await page.reload({ waitUntil: "networkidle" });
  const total = database.prepare("SELECT COUNT(*) AS total FROM stands").get().total;

  await page.getByText(`Visitados 9 de ${total}`).waitFor({ timeout: UI_TIMEOUT_MS });
  check(
    "the passport shows 9 visits and a ticket before the annulment",
    await page.getByText(/Boleto #\d+/).isVisible(),
  );

  return visitor.id;
}

// 12 perfect votes on ZB-S1 inside 10 minutes, by the passports 10013 to 10024 (one visit each): both alerts fire.
function insertPerfectVotes(database) {
  const stand = database.prepare("SELECT id FROM stands WHERE zone = 'B' AND number = 1").get();

  const visitors = database
    .prepare("SELECT id FROM visitors WHERE gamertag LIKE 'Visitante1%' ORDER BY gamertag DESC LIMIT 12")
    .all();

  for (const [index, visitor] of visitors.entries()) {
    insertVisit(database, { visitorId: visitor.id, standId: stand.id, minute: index / 2, rating: 5 });
  }
}

async function checkFraudAlerts({ page, screenshots }) {
  await page.goto(`${BASE_URL}/admin/moderation`, { waitUntil: "networkidle" });

  const bursts = page.getByTestId("fraud-bursts");

  await bursts.getByText(/ZB-S1-.*: 12 calificaciones de 5/).waitFor({ timeout: UI_TIMEOUT_MS });
  check("the alert of inflated ratings names ZB-S1 with 12 perfect votes (RF-45)", true);

  const fewStands = await page.getByTestId("fraud-few-stands").textContent();

  check("the alert of visitors of a single stand lists the one-visit passports", /1 check-in/.test(fewStands));
  await page.screenshot({ path: path.join(screenshots, "sysadmin-tools-03-alerts.png"), fullPage: true });
}

// E2E-14 steps 1 and 2: the annulment voids the ticket and the passport shows 8 visits and the voided ticket.
async function annulOneVisit({ pages, database, screenshots, visitorId }) {
  const page = pages.sysadmin;

  await searchVisitor(page, GAMERTAG);

  const firstVisit = page.getByTestId("moderation-check-in").first();

  await firstVisit.locator("summary").click();
  await firstVisit.getByLabel("Motivo").fill("Visita registrada sin jugar");
  await firstVisit.getByRole("button", { name: "Confirmar anulación" }).click();
  // The row turns into the annulled visit, with its reason and who annulled it, once the panel refreshes.
  await page.getByText("Anulada por Sysadmin: Visita registrada sin jugar").waitFor({ timeout: UI_TIMEOUT_MS });
  check(
    "the panel shows the voided ticket",
    (await page.getByTestId("moderation-tickets").textContent()).includes("anulado"),
  );

  const annulled = database
    .prepare(
      "SELECT annulled_reason AS reason, annulled_by_id AS byId FROM checkins WHERE visitor_id = ? AND annulled_at IS NOT NULL",
    )
    .all(visitorId);

  const ticket = database.prepare("SELECT status FROM raffle_tickets WHERE visitor_id = ?").get(visitorId);

  check(
    "the check-in is annulled with its reason and who did it; nothing was deleted",
    annulled.length === 1 && annulled[0].byId !== null,
  );
  check("its ticket became voided in the same transaction", ticket?.status === "voided", ticket?.status);
  check("the votes of the passport are all still there", count(database, "votes", `visitor_id = '${visitorId}'`) === 9);
  await page.screenshot({ path: path.join(screenshots, "sysadmin-tools-04-annulment.png"), fullPage: true });

  await pages.visitor.reload({ waitUntil: "networkidle" });
  await pages.visitor
    .getByText(`Visitados 8 de ${database.prepare("SELECT COUNT(*) AS total FROM stands").get().total}`)
    .waitFor({ timeout: UI_TIMEOUT_MS });
  check("the passport shows 8 visits and the voided ticket", await pages.visitor.getByText(/^Anulado/).isVisible());
  await pages.visitor.screenshot({
    path: path.join(screenshots, "sysadmin-tools-05-passport-voided.png"),
    fullPage: true,
  });
}

// E2E-14 step 3 and UT-CI-19: an excluded passport keeps its data and the kiosk refuses its PIN.
async function excludeVisitor({ pages, database }) {
  const page = pages.sysadmin;

  await searchVisitor(page, EXCLUDED_PIN);
  await page.locator("summary", { hasText: "Excluir visitante" }).click();
  await page.locator("details", { hasText: "Excluir visitante" }).getByLabel("Motivo").fill("Integrante de un equipo");
  await page.getByRole("button", { name: "Confirmar exclusión" }).click();
  await page.getByText("Excluido: Integrante de un equipo").waitFor({ timeout: UI_TIMEOUT_MS });

  const excluded = database
    .prepare("SELECT excluded_reason AS reason FROM visitors WHERE gamertag = 'Visitante10002'")
    .get();

  check("the visitor is excluded with its reason", excluded?.reason === "Integrante de un equipo", excluded?.reason);

  await signIn(pages.staff, STAFF);
  await pages.staff.waitForURL(/\/stand\/kiosk$/, { timeout: UI_TIMEOUT_MS });
  await pages.staff.getByLabel("PIN de 5 dígitos").fill(EXCLUDED_PIN);
  await pages.staff.getByRole("button", { name: "Continuar" }).click();
  await pages.staff.getByText("Este pasaporte no puede registrar visitas").waitFor({ timeout: UI_TIMEOUT_MS });
  check("the kiosk refuses the PIN of the excluded visitor", true);
}

async function searchVisitor(page, query) {
  await page.goto(`${BASE_URL}/admin/moderation?q=${encodeURIComponent(query)}`, { waitUntil: "networkidle" });
  await page.getByRole("article").first().waitFor({ timeout: UI_TIMEOUT_MS });
}

// RF-72: a genre with games cannot be deleted; a new one is added and deleted.
async function manageGenres({ page, database }) {
  await page.goto(`${BASE_URL}/admin/catalog`, { waitUntil: "networkidle" });
  await page.getByLabel("Nuevo género").fill("Party");
  await page.getByRole("button", { name: "Agregar género" }).click();
  await page.getByText("Género agregado.").waitFor({ timeout: UI_TIMEOUT_MS });
  check("the new genre is in the catalog", count(database, "genres", "slug = 'party'") === 1);
  const genresWithParty = count(database, "genres");

  const used = page
    .getByTestId("genres-admin")
    .getByRole("listitem")
    .filter({ hasText: " juego" })
    .filter({ hasNotText: "0 juegos" })
    .first();

  await used.getByRole("button", { name: "Borrar" }).click();
  await used.getByRole("button", { name: "Sí, borrar" }).click();
  await used.getByText("Ese género tiene juegos asignados").waitFor({ timeout: UI_TIMEOUT_MS });
  check("a genre with games cannot be deleted", count(database, "genres") === genresWithParty);

  const party = page.getByTestId("genres-admin").getByRole("listitem").filter({ hasText: "Party" });

  await party.getByRole("button", { name: "Borrar" }).click();
  await party.getByRole("button", { name: "Sí, borrar" }).click();
  await party.waitFor({ state: "detached", timeout: UI_TIMEOUT_MS });
  check("a genre without games is deleted", count(database, "genres", "slug = 'party'") === 0);
}

// RF-41: the new sponsor shows on /sponsors without a deploy.
async function registerSponsor({ page, database, screenshots }) {
  await page.goto(`${BASE_URL}/admin/catalog`, { waitUntil: "networkidle" });
  await page.locator("summary", { hasText: "Nuevo patrocinador" }).click();

  const form = page.locator("details", { hasText: "Nuevo patrocinador" });

  await form.getByLabel("Nombre").fill("Pixel Coffee");
  await form.getByLabel("Ruta del logo").fill("/sponsors/nodo-caribe.svg");
  await form.getByLabel("Sitio web").fill("https://example.com/pixel-coffee");
  await form.getByLabel("Teléfono de contacto").fill("+52 998 555 0101");
  await form.getByLabel("Servicios").fill("Café para los desarrolladores.");
  await form.getByRole("button", { name: "Agregar patrocinador" }).click();
  await page.getByText("Patrocinador agregado.").waitFor({ timeout: UI_TIMEOUT_MS });

  const sponsor = database.prepare("SELECT phone FROM sponsors WHERE name = 'Pixel Coffee'").get();

  check("the sponsor is stored with its phone in E.164", sponsor?.phone === "+529985550101", sponsor?.phone);
  await page.screenshot({ path: path.join(screenshots, "sysadmin-tools-06-catalog.png"), fullPage: true });

  await page.goto(`${BASE_URL}/sponsors`, { waitUntil: "networkidle" });
  check("the public page of sponsors shows it", await page.getByText("Pixel Coffee").first().isVisible());
}

// RF-44: a blocked team email cannot register a passport (generic refusal).
async function blockTeamEmail({ pages, database, screenshots }) {
  const page = pages.sysadmin;

  await page.goto(`${BASE_URL}/admin/catalog`, { waitUntil: "networkidle" });
  await page.getByLabel("Correos", { exact: true }).fill(`${BLOCKED_EMAIL}, e2e-moderada@example.test`);
  await page.getByRole("button", { name: "Agregar a la lista" }).click();
  await page.getByText("Agregados: 2.").waitFor({ timeout: UI_TIMEOUT_MS });
  check(
    "the list flags the email that already has a passport",
    await page.getByText("Ya tiene pasaporte").first().isVisible(),
  );
  await page.screenshot({ path: path.join(screenshots, "sysadmin-tools-07-blocklist.png"), fullPage: true });

  const context = await page
    .context()
    .browser()
    .newContext({ viewport: { width: 390, height: 844 } });

  const phone = await context.newPage();

  await phone.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await phone.getByLabel("Nombre completo").fill("Integrante Equipo");
  await phone.getByLabel("Gamertag").fill("integrante_e3");
  await phone.getByLabel("Correo electrónico").fill(BLOCKED_EMAIL.toUpperCase());
  await phone.getByRole("button", { name: "Registrar pasaporte" }).click();
  await phone.getByText("No se pudo registrar este correo").waitFor({ timeout: UI_TIMEOUT_MS });
  check(
    "a blocked email cannot register, whatever its case",
    count(database, "visitors", "gamertag = 'integrante_e3'") === 0,
  );
  await context.close();
}

// RF-73 and RF-74: the status as text, "Reenviar" in the outbox and the switch of the public bracket.
async function checkServerStatus({ page, database, screenshots }) {
  for (let index = 0; index < 3; index += 1) await fetch(`${BASE_URL}/api/tournament/public`);

  const failed = insertFailedEmail(database);

  await page.goto(`${BASE_URL}/admin/server`, { waitUntil: "networkidle" });

  const load = await page.getByTestId("server-load").textContent();
  const bracket = await page.getByTestId("server-bracket").textContent();

  check("the status shows memory and CPU as text", /Memoria: .* MiB de .* MiB/.test(load) && /CPU: \d/.test(load));
  check(
    "the status counts the screens of the public bracket",
    /Pantallas consultando el bracket público: [1-9]/.test(bracket),
    bracket,
  );
  check(
    "the outbox shows its counts",
    /Enviados: \d+\. Pendientes: \d+\. Fallidos: [1-9]/.test(await page.getByTestId("server-outbox").textContent()),
  );
  await page.screenshot({ path: path.join(screenshots, "sysadmin-tools-08-server.png"), fullPage: true });

  const row = page.getByTestId("server-outbox").getByRole("listitem").filter({ hasText: "Correo de prueba" });

  await row.getByRole("button", { name: "Reenviar" }).click();
  await row.getByText("Correo de nuevo en la cola").waitFor({ timeout: UI_TIMEOUT_MS });

  const requeued = database.prepare("SELECT attempts FROM email_outbox WHERE id = ?").get(failed);

  check("Reenviar puts the email back in the queue", requeued.attempts < 5, String(requeued.attempts));

  await page.getByRole("button", { name: "Cerrar al público" }).click();
  await page.getByText("Bracket público cerrado.").waitFor({ timeout: UI_TIMEOUT_MS });

  const settings = database.prepare("SELECT public_bracket_enabled AS enabled FROM event_settings").get();
  const snapshot = await (await fetch(`${BASE_URL}/api/tournament/public`)).json();

  check("the sysadmin closes the public bracket (RF-74)", settings.enabled === 0 && snapshot.state === "closed");
}

async function checkPhoneWidth(page) {
  await page.goto(`${BASE_URL}/passport`, { waitUntil: "networkidle" });

  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

  check("the passport with a voided ticket has no horizontal scroll at 390 px", fits);
}

function insertFailedEmail(database) {
  const id = randomUUID();

  database
    .prepare(
      "INSERT INTO email_outbox (id, to_address, subject, text, attempts, next_attempt_at, created_at, last_error) VALUES (?, ?, ?, ?, 5, ?, ?, ?)",
    )
    .run(id, "alguien@example.test", "Correo de prueba", "Cuerpo", timestamp(0), timestamp(0), "connect ECONNREFUSED");

  return id;
}

function insertVisit(database, { visitorId, standId, minute, rating = 4 }) {
  const checkInId = randomUUID();
  const at = timestamp(minute);

  database
    .prepare("INSERT INTO checkins (id, visitor_id, stand_id, checked_in_at) VALUES (?, ?, ?, ?)")
    .run(checkInId, visitorId, standId, at);
  database
    .prepare(
      "INSERT INTO votes (id, check_in_id, visitor_id, stand_id, game_rating, stand_rating, art_rating, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(randomUUID(), checkInId, visitorId, standId, rating, rating, rating, at);
}

// The format Prisma writes with the SQLite adapter, a few minutes ago so the window of the alert holds them all.
function timestamp(minute) {
  return new Date(Date.now() - 20 * 60_000 + minute * 60_000).toISOString().replace("Z", "+00:00");
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

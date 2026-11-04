// End-to-end check of the stand kiosk without connection (RF-24, RF-35, RF-78): npm run test:e2e:offline-kiosk
//
// The staff of ZA-S3 keeps /stand/kiosk open on a desktop window and a visitor keeps /passport open on a phone-sized one.
// The kiosk goes offline with `context.setOffline(true)`, takes visits into its IndexedDB queue and sends them in
// batches when the network comes back. Covers E2E-07 and E2E-18 of odd/requirements/e2e-flows.md.
//
// Creates its own SQLite database in the system temp dir, seeds it (db:seed and db:seed:stands), starts `next dev` on
// E2E_PORT (3521 by default) and removes everything when it finishes. The checks read the database to confirm what was
// recorded. The PIN filter uses the salt the seed fixes, so the script computes a PIN that is nobody's and does not pass
// the filter, and another that is nobody's but passes it (a false positive), with the same PBKDF2 as the kiosk.
//
// Browser: set E2E_CHROMIUM_PATH to an installed Chromium, or run `npx playwright-core install chromium` and leave it
// unset. Screenshots go to e2e/screenshots (not versioned; override with E2E_SCREENSHOTS_DIR). E2E_KEEP_FILES=1 keeps
// the database and the server log; they are also kept when a check fails.
import { spawn, spawnSync } from "node:child_process";
import { createHmac, hkdfSync, randomBytes, webcrypto } from "node:crypto";
import { mkdirSync, mkdtempSync, openSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const NEXT_CLI = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

const PORT = Number(process.env.E2E_PORT ?? 3521);

const BASE_URL = `http://localhost:${PORT}`;

const STAFF_EMAIL = "staff-za-s3@ejemplo.com";

const STAFF_PASSWORD = "stand-dev-password";

const GAMERTAG = "e2e_offline";

const PIN_KEY = randomBytes(32).toString("base64");

// Seed passports that have not visited ZA-S3 (10001 already did, see stands-dev-seed.ts).
const OFFLINE_PINS = ["10002", "10003", "10004"];

const SERVER_READY_TIMEOUT_MS = 180_000;

const UI_TIMEOUT_MS = 20_000;

const SUBMIT = "Enviar y registrar mi visita";

// What a browser logs by itself while it has no network, and the refusals the script asks for on purpose (400, 401
// and 413); any other console error fails the run.
const NETWORK_NOISE =
  /ERR_INTERNET_DISCONNECTED|ERR_NETWORK_CHANGED|ERR_CONNECTION_REFUSED|ERR_FAILED|WebSocket|Failed to fetch|status of (400|401|413)/;

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
  const workdir = mkdtempSync(path.join(tmpdir(), "ut-e3-e2e-offline-kiosk-"));
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
    PIN_ENCRYPTION_KEY: PIN_KEY,
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

// npm sets npm_execpath when it runs this script, so the same npm CLI runs the seeds.
function runNpmScript(name, env) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, "run", name], { env, stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`npm run ${name} failed with exit code ${result.status}`);
  }
}

function startDevServer(env, logFile) {
  const log = openSync(logFile, "w");

  return spawn(process.execPath, [NEXT_CLI, "dev", "-p", String(PORT)], { env, stdio: ["ignore", log, log] });
}

async function stopServer(server) {
  if (process.platform === "win32") {
    const taskkill = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "taskkill.exe");

    spawnSync(taskkill, ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    server.kill();
  }

  await delay(1000);
}

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

      if (response.status < 500) return;
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
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const visitorPage = await phone.newPage();
  const staffPage = await desktop.newPage();
  const session = { desktop, visitorPage, staffPage, database, screenshots };

  for (const page of [visitorPage, staffPage]) {
    page.on("console", (message) => {
      if (message.type() === "error" && !NETWORK_NOISE.test(message.text())) consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
  }

  try {
    const pin = await registerVisitor(visitorPage);

    await loginAsStaff(staffPage);
    const pins = await computeFilterPins(session, [pin]);

    await checkFilterAccess(visitorPage);
    await checkUnknownPinOffline(session, pins.failing);
    await checkThreeVisitsOffline(session);
    await checkFalsePositive(session, pins.falsePositive);
    await checkQueueSurvivesReloadAndRetries(session);
    await checkLateVisit(session, pin);
    await checkDumbRequests(session);
    await checkMobileLayout(staffPage);
  } finally {
    check("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");
    await phone.close();
    await desktop.close();
    database.close();
  }
}

async function registerVisitor(page) {
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Nombre completo").fill("E2E Offline");
  await page.getByLabel("Gamertag").fill(GAMERTAG);
  await page.getByLabel("Correo electrónico").fill("e2e-offline@example.test");
  await page.getByRole("button", { name: "Registrar pasaporte" }).click();
  await page.waitForURL(/\/passport$/, { timeout: 30_000 });

  const pin = (await page.locator("p.type-mono").first().textContent()).trim();
  check("visitor registers and gets a five-digit PIN", /^\d{5}$/.test(pin), pin);

  return pin;
}

// The kiosk downloads the filter when it opens; the visitor registered before, so the filter already has the PIN.
async function loginAsStaff(page) {
  await page.goto(`${BASE_URL}/stand/kiosk`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/login/, { timeout: UI_TIMEOUT_MS });
  await page.getByLabel("Correo").fill(STAFF_EMAIL);
  await page.getByLabel("Contraseña").fill(STAFF_PASSWORD);

  const filterDownload = page.waitForResponse((response) => response.url().endsWith("/api/stand/pin-filter"), {
    timeout: 60_000,
  });

  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/stand\/kiosk$/, { timeout: UI_TIMEOUT_MS });
  await page.getByRole("heading", { name: "Escribe tu PIN" }).waitFor({ timeout: UI_TIMEOUT_MS });

  const response = await filterDownload;
  check("the kiosk of ZA-S3 opens and downloads the PIN filter", response.status() === 200, String(response.status()));
}

// The same reduction as src/features/stands/lib/pin-filter.ts, from the filter the kiosk downloaded.
async function computeFilterPins(session, registeredPins) {
  const filter = await session.staffPage.evaluate(async () => (await fetch("/api/stand/pin-filter")).json());
  const body = JSON.stringify(filter);
  const values = new Set(filter.values);
  const registered = new Set([...registeredPins, ...seedPins()]);

  check(
    "the filter carries no PIN in clear (RNF-19)",
    [...registered].every((pin) => !body.includes(`"${pin}"`)) &&
      Object.keys(filter).join() === "salt,iterations,modulus,values",
    `salt=${filter.salt} modulus=${filter.modulus} values=${filter.values.length}`,
  );

  let falsePositive = null;
  let failing = null;

  for (let value = 20_000; value < 100_000 && (!falsePositive || !failing); value += 1) {
    const pin = String(value);

    if (registered.has(pin) || isRegistered(session.database, pin)) continue;

    const passes = values.has(await reducePin(pin, filter));

    if (passes) falsePositive ??= pin;
    else failing ??= pin;
  }

  check("found a PIN that is nobody's but passes the filter (false positive)", Boolean(falsePositive), falsePositive);
  check("found a PIN that is nobody's and does not pass the filter", Boolean(failing), failing);

  return { falsePositive, failing };
}

async function checkFilterAccess(visitorPage) {
  const status = await visitorPage.evaluate(async () => (await fetch("/api/stand/pin-filter")).status);

  check("a visitor cannot download the PIN filter (UT-CI-32)", status === 401, String(status));
}

// E2E-18, step 1: offline, a PIN that does not pass the filter never opens the survey and the queue stays the same.
async function checkUnknownPinOffline({ desktop, staffPage, screenshots }, failingPin) {
  await desktop.setOffline(true);
  await staffPage.getByText("Sin conexión · las visitas se guardan en este equipo").waitFor({ timeout: UI_TIMEOUT_MS });
  check("the kiosk says it is offline", true);

  await typePin(staffPage, failingPin);
  await staffPage.getByText("PIN no reconocido, revísalo").waitFor({ timeout: UI_TIMEOUT_MS });
  check(`offline PIN ${failingPin} -> "PIN no reconocido, revísalo"`, true);
  check(
    "and the survey does not open",
    (await staffPage.getByRole("heading", { name: "¿Qué te pareció?" }).count()) === 0,
  );
  check("and nothing is queued", (await countQueued(staffPage)) === 0);
  await staffPage.screenshot({ path: path.join(screenshots, "offline-kiosk-unknown-pin.png"), fullPage: true });
  await staffPage.getByLabel("PIN de 5 dígitos").fill("");
  await desktop.setOffline(false);
}

// E2E-07, steps 1 to 4.
async function checkThreeVisitsOffline({ desktop, staffPage, database, screenshots }) {
  await desktop.setOffline(true);

  for (const pin of OFFLINE_PINS) await answerOnTheKiosk(staffPage, pin, ["5", "4", "3"]);

  await staffPage.getByText("Sin conexión · 3 visitas por enviar").waitFor({ timeout: UI_TIMEOUT_MS });
  check('three offline visits -> "Sin conexión · 3 visitas por enviar"', true);
  check("the three visits wait in IndexedDB", (await countQueued(staffPage)) === 3);
  check("and none reached the server yet", countOfflineVisits(database) === 0);
  check("the kiosk never shows a rating", !/[1-5]\s*\/\s*5/.test(await staffPage.locator("body").textContent()));
  await staffPage.screenshot({ path: path.join(screenshots, "offline-kiosk-three-pending.png"), fullPage: true });

  await desktop.setOffline(false);
  await staffPage.getByText("Todo enviado").waitFor({ timeout: UI_TIMEOUT_MS });
  check('back online -> "Todo enviado"', true);
  await staffPage.screenshot({ path: path.join(screenshots, "offline-kiosk-all-sent.png"), fullPage: true });

  const rows = database
    .prepare(
      "SELECT v.gamertag AS gamertag, c.scanned_at AS scannedAt, a.email AS staff, o.game_rating AS g FROM checkins c JOIN visitors v ON v.id = c.visitor_id JOIN accounts a ON a.id = c.scanned_by_id JOIN votes o ON o.check_in_id = c.id JOIN stands s ON s.id = c.stand_id WHERE s.zone = 'A' AND s.number = 3 AND v.gamertag IN ('Visitante10002', 'Visitante10003', 'Visitante10004') ORDER BY v.gamertag",
    )
    .all();

  check(
    "the three visits are recorded at ZA-S3 with the hour of the PIN, the staff and the survey",
    rows.length === 3 &&
      rows.every((row) => row.scannedAt && row.staff === STAFF_EMAIL && row.g === 5) &&
      rows.map((row) => row.gamertag).join() === OFFLINE_PINS.map((pin) => `Visitante${pin}`).join(),
    JSON.stringify(rows),
  );
  check("the queue is empty", (await countQueued(staffPage)) === 0);
}

// E2E-18, step 2 and 3 (EC-16): the false positive opens the survey, and the server refuses it when it arrives.
async function checkFalsePositive({ desktop, staffPage, database, screenshots }, falsePositive) {
  const before = { checkIns: count(database, "checkins"), votes: count(database, "votes") };

  await desktop.setOffline(true);
  await answerOnTheKiosk(staffPage, falsePositive, ["4", "4", "4"]);
  check(
    `false positive ${falsePositive} passes the filter and goes to the queue`,
    (await countQueued(staffPage)) === 1,
  );

  await desktop.setOffline(false);

  const rejected = staffPage.getByRole("region", { name: "Visitas guardadas sin conexión" });

  await rejected.getByText("PIN no reconocido.").waitFor({ timeout: UI_TIMEOUT_MS });

  const text = await rejected.textContent();

  check(
    'it appears under "No registradas" with the reason and the instruction',
    text.includes("Que revise su pasaporte o vaya a Atención"),
    text,
  );
  check("and it identifies nobody (no PIN, no gamertag)", !text.includes(falsePositive) && !/Visitante\d+/.test(text));
  check(
    "no check-in nor vote was created and no passport got a notice",
    count(database, "checkins") === before.checkIns &&
      count(database, "votes") === before.votes &&
      count(database, "rejected_visits") === 0,
  );
  await staffPage.screenshot({ path: path.join(screenshots, "offline-kiosk-rejected.png"), fullPage: true });
}

// RF-35: the queue lives in IndexedDB, so a reload keeps it; while the server does not answer the kiosk retries with
// backoff, and it sends the visit once the server is back.
async function checkQueueSurvivesReloadAndRetries({ desktop, staffPage, database }) {
  const pin = "10005";

  await desktop.setOffline(true);
  await answerOnTheKiosk(staffPage, pin, ["3", "3", "3"]);

  let attempts = 0;

  await staffPage.route("**/api/stand/queued-visits", (route) => {
    attempts += 1;

    return route.abort("connectionrefused");
  });
  await desktop.setOffline(false);
  await staffPage.reload({ waitUntil: "networkidle" });
  await staffPage.getByText("Sin respuesta del servidor · 1 visita por enviar").waitFor({ timeout: UI_TIMEOUT_MS });
  check("after a reload the visit is still in the queue and the kiosk retries", (await countQueued(staffPage)) === 1);

  await delay(4000);
  check(
    "it keeps retrying with backoff, not in a tight loop",
    attempts >= 2 && attempts <= 6,
    `${attempts} attempts in ~4 s`,
  );

  await staffPage.unroute("**/api/stand/queued-visits");
  await staffPage.getByText("Todo enviado").waitFor({ timeout: 90_000 });
  check(
    "once the server answers, the visit is recorded",
    database
      .prepare("SELECT COUNT(*) AS n FROM checkins c JOIN visitors v ON v.id = c.visitor_id WHERE v.gamertag = ?")
      .get(`Visitante${pin}`).n === 1,
  );
}

// E2E-07, step 5: a visit taken before the cutoff that reaches the server once the raffle started is refused, and the
// passport of the visitor says so (RF-24). The hours are moved around the real clock, as e2e-flows.md says.
async function checkLateVisit({ desktop, staffPage, visitorPage, database, screenshots }, pin) {
  const now = Date.now();

  database
    .prepare("UPDATE event_settings SET event_starts_at = ?, check_in_cutoff_at = ?, raffle_starts_at = ? WHERE id = 1")
    .run(iso(now - 2 * 3600_000), iso(now + 60_000), iso(now + 61_000));

  await desktop.setOffline(true);
  await answerOnTheKiosk(staffPage, pin, ["5", "5", "5"]);
  check("the visit of the visitor waits in the queue", (await countQueued(staffPage)) === 1);

  database
    .prepare("UPDATE event_settings SET check_in_cutoff_at = ?, raffle_starts_at = ? WHERE id = 1")
    .run(iso(Date.now() + 1000), iso(Date.now() + 2000));
  await delay(3000);
  await desktop.setOffline(false);

  const rejected = staffPage.getByRole("region", { name: "Visitas guardadas sin conexión" });

  await rejected.getByText("Llegó después del cierre del registro de visitas.").waitFor({ timeout: UI_TIMEOUT_MS });
  check('the late visit appears under "No registradas" with its reason', true);
  await staffPage.screenshot({ path: path.join(screenshots, "offline-kiosk-late.png"), fullPage: true });

  const visitor = database.prepare("SELECT id FROM visitors WHERE gamertag = ?").get(GAMERTAG);

  check("no check-in was created for the visitor", count(database, "checkins", `visitor_id = '${visitor.id}'`) === 0);
  check(
    "the refusal is kept for the passport",
    count(database, "rejected_visits", `visitor_id = '${visitor.id}'`) === 1,
  );

  await visitorPage.reload({ waitUntil: "networkidle" });

  const notice = visitorPage.getByRole("alert").filter({ hasText: "Tu visita a ZA-S3 no se registró" });

  await notice.waitFor({ timeout: UI_TIMEOUT_MS });
  check(
    'the passport shows "Tu visita a ZA-S3 no se registró" with the reason',
    (await notice.textContent()).includes("cierre"),
  );
  await visitorPage.screenshot({ path: path.join(screenshots, "offline-kiosk-passport-notice.png"), fullPage: true });
}

// Trying to break it the dumb way: a batch sent twice, a batch too big, junk, and a batch without a session.
async function checkDumbRequests({ staffPage, visitorPage, database }) {
  const existing = database.prepare("SELECT id FROM checkins WHERE scanned_at IS NOT NULL LIMIT 1").get();

  const visit = {
    id: existing.id,
    pin: "10002",
    ratings: { gameRating: 1, standRating: 1, artRating: 1 },
    scannedAt: new Date().toISOString(),
  };

  const before = count(database, "votes");

  const resent = await postBatch(staffPage, { visits: [visit, visit] });

  check(
    "a batch sent again answers duplicate and records nothing (UT-CI-04)",
    resent.status === 200 &&
      resent.body.results.every((result) => result.status === "duplicate") &&
      count(database, "votes") === before,
    JSON.stringify(resent.body),
  );

  const tooBig = await postBatch(staffPage, { visits: Array.from({ length: 51 }, () => visit) });
  check("a batch of 51 visits is refused with 413 (UT-CI-15)", tooBig.status === 413, String(tooBig.status));

  const junk = await postRaw(staffPage, "no soy json");
  check("a body that is not JSON gets 400", junk.status === 400, String(junk.status));

  const broken = await postBatch(staffPage, {
    visits: [{ ...visit, id: "e2e00000-0000-4000-8000-000000000001", pin: "abc", ratings: { gameRating: 99 } }],
  });

  check(
    "a visit with a bad PIN or ratings is answered invalid, not recorded",
    broken.body?.results?.[0]?.status === "invalid",
    JSON.stringify(broken.body),
  );

  const anonymous = await postBatch(visitorPage, { visits: [] });
  check("a visitor cannot send kiosk batches (401)", anonymous.status === 401, String(anonymous.status));
}

// The kiosk is used on a desktop, but the staff may open it on a phone: no horizontal scroll at 360 px.
async function checkMobileLayout(staffPage) {
  await staffPage.setViewportSize({ width: 360, height: 740 });
  await staffPage.reload({ waitUntil: "networkidle" });

  const overflow = await staffPage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  check("no horizontal scroll at 360 px with the rejected list", overflow <= 0, `${overflow}px`);
}

async function postBatch(page, batch) {
  return postRaw(page, JSON.stringify(batch));
}

// Posts from the page, so the request carries the session cookie of that context.
async function postRaw(page, text) {
  return page.evaluate(async (payload) => {
    const response = await fetch("/api/stand/queued-visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });

    return { status: response.status, body: await response.json().catch(() => null) };
  }, text);
}

async function answerOnTheKiosk(page, pin, [game, stand, art]) {
  await typePin(page, pin);
  await page.getByRole("heading", { name: "¿Qué te pareció?" }).waitFor({ timeout: UI_TIMEOUT_MS });
  await rate(page, "El juego", game);
  await rate(page, "El stand", stand);
  await rate(page, "El arte", art);
  await page.getByRole("button", { name: SUBMIT }).click();
  await page.getByText("se enviará sola cuando vuelva la conexión").waitFor({ timeout: UI_TIMEOUT_MS });
  await page.getByRole("heading", { name: "Escribe tu PIN" }).waitFor({ timeout: UI_TIMEOUT_MS });
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

// Reads the pending store of the kiosk's IndexedDB, as the page sees it.
async function countQueued(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("ute3-kiosk-queue-ZA-S3", 1);

        request.onsuccess = () => {
          const all = request.result.transaction("pending", "readonly").objectStore("pending").count();

          all.onsuccess = () => resolve(all.result);
          all.onerror = () => reject(all.error);
        };

        request.onerror = () => reject(request.error);
      }),
  );
}

async function reducePin(pin, { salt, iterations, modulus }) {
  const encoder = new TextEncoder();
  const key = await webcrypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveBits"]);

  const bits = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations },
    key,
    256,
  );

  return new Uint8Array(bits).slice(0, 6).reduce((total, byte) => total * 256 + byte, 0) % modulus;
}

// The same HMAC lookup as src/shared/lib/server/pin-cipher.ts, to make sure a computed PIN is nobody's.
function isRegistered(database, pin) {
  const key = Buffer.from(
    hkdfSync("sha256", Buffer.from(PIN_KEY, "base64"), "", "ut-game-showcase-pin-hmac-lookup", 32),
  );

  const lookup = createHmac("sha256", key).update(pin, "utf8").digest("hex");

  return Boolean(database.prepare("SELECT 1 AS found FROM visitors WHERE pin_hmac = ?").get(lookup));
}

function seedPins() {
  return Array.from({ length: 24 }, (_, index) => String(10001 + index));
}

function countOfflineVisits(database) {
  const gamertags = OFFLINE_PINS.map((pin) => `'Visitante${pin}'`).join(", ");

  return database
    .prepare(
      `SELECT COUNT(*) AS n FROM checkins c JOIN visitors v ON v.id = c.visitor_id WHERE v.gamertag IN (${gamertags})`,
    )
    .get().n;
}

function count(database, table, where = "1 = 1") {
  return database.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`).get().n;
}

function iso(milliseconds) {
  return new Date(milliseconds).toISOString();
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

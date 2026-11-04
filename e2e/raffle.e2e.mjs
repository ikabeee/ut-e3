// End-to-end check of the raffle (E2E-09) with real browsers: npm run test:e2e:raffle
//
// Two raffle administrators sign in at /login and land on /admin/raffle. Before the start nobody spins; when the hour
// passes, the first one spins, the stage screen /raffle/live shows the ticket and the gamertag without reloading, and
// the decision blocks the next spin. A discarded ticket sends no email; a winner gets one, sees "Ganaste" on the
// passport and appears in the public section /raffle; the other administrator registers the prize. The tickets of a
// visitor that came out never come out again, and closing the raffle stops every spin.
// Creates its own SQLite database in the system temp dir, seeds it (db:seed and db:seed:raffle), starts `next dev` on
// E2E_PORT and removes everything when it finishes. The checks read and adjust the database: which tickets are active
// is set there so the random draw has a known answer.
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

const PORT = Number(process.env.E2E_PORT ?? 3511);

const BASE_URL = `http://localhost:${PORT}`;

const ANIMATOR_1 = { email: "rifa-1@ejemplo.com", password: "raffle-dev-password" };

const ANIMATOR_2 = { email: "rifa-2@ejemplo.com", password: "raffle-dev-password" };

const DECOY_GAMERTAG = "Rifa20001";

const WINNER = { fullName: "E2E Trinity", gamertag: "e2e_trinity", email: "e2e-trinity@example.test" };

const PRIZE = "Audífonos inalámbricos";

// Enough for the server to answer the first page after it compiled, so the first spin is tried before the start.
const START_DELAY_MS = 20_000;

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
  const workdir = mkdtempSync(path.join(tmpdir(), "ut-e3-e2e-raffle-"));
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
    // Closed port: the outbox keeps the emails and retries, as in production, so the checks read them there.
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "1",
    SMTP_USER: "e2e",
    SMTP_PASSWORD: "e2e",
    SMTP_FROM: "e2e@example.test",
    SYSADMIN_EMAIL: "sysadmin@example.test",
    SYSADMIN_NAME: "Sysadmin",
    SYSADMIN_PASSWORD: "E2e-Sysadmin-2026!",
    RAFFLE_DEV_PASSWORD: ANIMATOR_1.password,
  };
}

function prepareDatabase(env) {
  runNpmScript("db:deploy", env);
  runNpmScript("db:seed", env);
  runNpmScript("db:seed:raffle", env);
}

// npm sets npm_execpath when it runs this script (`npm run test:e2e:raffle`), so the same npm CLI runs the seeds.
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
      const response = await fetch(`${BASE_URL}/api/raffle/live`);

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
    animator: await browser.newContext({ viewport: { width: 1440, height: 900 } }),
    other: await browser.newContext({ viewport: { width: 1440, height: 900 } }),
    stage: await browser.newContext({ viewport: { width: 1920, height: 1080 } }),
    phone: await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }),
    guest: await browser.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true }),
  };

  const pages = await openPages(contexts, consoleErrors);
  const shot = (page, name) => page.screenshot({ path: path.join(screenshots, `raffle-${name}.png`), fullPage: true });

  try {
    await checkAccessIsGuarded(pages.guest);
    openRegistration(database);
    await registerWinner(pages.phone);
    await checkNoWinBeforeTheRaffle(pages.phone);
    prepareStart(database);
    await loginAs(pages.animator, ANIMATOR_1);
    await loginAs(pages.other, ANIMATOR_2);
    await pages.stage.goto(`${BASE_URL}/raffle/live`, { waitUntil: "networkidle" });
    await checkNoSpinBeforeTheStart(pages.animator, pages.stage, shot);
    keepOnlyTicketsOf(database, [DECOY_GAMERTAG]);
    await waitForSpinEnabled(pages.animator, "at the start hour Girar turns on by itself, without reloading");
    await checkSpinButtonSize(pages.animator);
    await discardTheDecoy({ pages, database, shot });
    giveTicketTo(database, WINNER.gamertag);
    await confirmTheWinner({ pages, database, shot });
    await registerThePrize({ pages, database, shot });
    await checkDrawnVisitorsNeverReturn(pages.animator, database);
    await closeTheRaffle({ pages, database, shot });
    await checkMobileLayout(pages.guest, shot);
    checkAudit(database);
  } finally {
    check("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");

    for (const context of Object.values(contexts)) await context.close();
    database.close();
  }
}

async function openPages(contexts, consoleErrors) {
  const pages = {};

  for (const [name, context] of Object.entries(contexts)) {
    pages[name] = await context.newPage();
    pages[name].on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`${name}: ${message.text()}`);
    });
    pages[name].on("pageerror", (error) => consoleErrors.push(`${name}: ${String(error)}`));
  }

  return pages;
}

async function checkAccessIsGuarded(page) {
  await page.goto(`${BASE_URL}/admin/raffle`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/login/, { timeout: UI_TIMEOUT_MS });
  check("the raffle panel without a session -> /login", /\/login/.test(page.url()), page.url());

  const response = await fetch(`${BASE_URL}/api/raffle`);

  check("GET /api/raffle without a session answers 401", response.status === 401, String(response.status));

  const live = await (await fetch(`${BASE_URL}/api/raffle/live`)).text();

  check(
    "the public endpoint carries no email or full name",
    !live.includes("@") && !live.includes("Visitante de rifa"),
  );
}

function openRegistration(database) {
  database.prepare("UPDATE event_settings SET registration_opens_at = ?").run(toDatabaseDate(Date.now() - 86_400_000));
}

async function registerWinner(page) {
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Nombre completo").fill(WINNER.fullName);
  await page.getByLabel("Gamertag").fill(WINNER.gamertag);
  await page.getByLabel("Correo electrónico").fill(WINNER.email);
  await page.getByRole("button", { name: "Registrar pasaporte" }).click();
  await page.waitForURL(/\/passport$/, { timeout: UI_TIMEOUT_MS });
  check("the future winner registers a passport on the phone", true, page.url());
}

async function checkNoWinBeforeTheRaffle(page) {
  const hasNotice = await page.getByRole("heading", { name: "Ganaste" }).count();

  check("the passport says nothing about the raffle before winning", hasNotice === 0);
}

// The raffle seed opened the raffle now; it moves a few seconds ahead so the first spin is tried before the start.
function prepareStart(database) {
  database
    .prepare("UPDATE event_settings SET raffle_starts_at = ? WHERE id = 1")
    .run(toDatabaseDate(Date.now() + START_DELAY_MS));
}

async function loginAs(page, { email, password }) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/admin\/raffle$/, { timeout: UI_TIMEOUT_MS });
  await page.getByRole("button", { name: "Girar" }).waitFor({ timeout: UI_TIMEOUT_MS });
  check(`${email} signs in at /login and lands on /admin/raffle`, true, page.url());
}

async function checkNoSpinBeforeTheStart(page, stage, shot) {
  const status = await page
    .getByText(/La rifa empieza a las \d\d:\d\d\./)
    .first()
    .isVisible();

  check("before the start the panel says when the raffle begins", status);
  check("and Girar is disabled", await page.getByRole("button", { name: "Girar" }).isDisabled());
  check("the stage screen announces the start", await stage.getByText(/La rifa empieza a las/).isVisible());
  await shot(stage, "live-upcoming");
}

async function waitForSpinEnabled(page, label = "") {
  await page.waitForFunction(
    () => [...document.querySelectorAll("button")].some((button) => button.textContent === "Girar" && !button.disabled),
    undefined,
    { timeout: START_DELAY_MS + UI_TIMEOUT_MS },
  );

  if (label) check(label, true);
}

async function checkSpinButtonSize(page) {
  const box = await page.getByRole("button", { name: "Girar" }).boundingBox();

  check("Girar measures at least 44x44 px", box.width >= 44 && box.height >= 44, `${box.width}x${box.height}`);
}

async function discardTheDecoy({ pages, database, shot }) {
  const before = count(database, "email_outbox");

  await pages.animator.getByRole("button", { name: "Girar" }).click();
  await pages.animator.getByRole("alertdialog").waitFor({ timeout: UI_TIMEOUT_MS });

  const dialog = await pages.animator.getByRole("alertdialog").textContent();

  check(
    "the animator sees a modal with the ticket and the gamertag",
    dialog.includes(DECOY_GAMERTAG),
    dialog.replace(/\s+/g, " "),
  );
  check("with Ganador and Descartado", dialog.includes("Ganador") && dialog.includes("Descartado"));
  check("and Girar stays disabled behind it", await isSpinDisabled(pages.animator));
  await shot(pages.animator, "admin-decision");

  await waitForStage(pages.stage, DECOY_GAMERTAG);
  await shot(pages.stage, "live-pending");
  await checkOtherAnimatorIsBlocked(pages.other, shot);

  await pages.animator.getByRole("button", { name: "Descartado" }).click();
  await pages.animator.getByRole("alertdialog").waitFor({ state: "detached", timeout: UI_TIMEOUT_MS });
  check("Descartado sends no email", count(database, "email_outbox") === before);
  await waitForStageText(pages.stage, "Descartado");
  check("the stage screen shows the ticket as Descartado", true);
}

async function checkOtherAnimatorIsBlocked(page, shot) {
  await page.getByText("Otro animador está girando").waitFor({ timeout: UI_TIMEOUT_MS });
  check("the other animator sees Otro animador está girando", true);
  check("and cannot spin", await isSpinDisabled(page));
  await shot(page, "admin-busy");
}

async function confirmTheWinner({ pages, database, shot }) {
  await waitForSpinEnabled(pages.animator);
  await pages.animator.getByRole("button", { name: "Girar" }).click();
  await pages.animator.getByRole("alertdialog").waitFor({ timeout: UI_TIMEOUT_MS });

  const dialog = await pages.animator.getByRole("alertdialog").textContent();

  check(
    "after a discarded ticket the animator can spin again",
    dialog.includes(WINNER.gamertag),
    dialog.replace(/\s+/g, " "),
  );
  await waitForStage(pages.stage, WINNER.gamertag);
  await pages.animator.getByRole("button", { name: "Ganador" }).click();
  await pages.animator.getByRole("alertdialog").waitFor({ state: "detached", timeout: UI_TIMEOUT_MS });
  await waitForStageText(pages.stage, "¡Ganador!");
  await shot(pages.stage, "live-winner");
  checkWinnerEmail(database);
  await checkPassportWin(pages.phone, null, shot);
  await checkPublicWinners(pages.guest, null);
}

function checkWinnerEmail(database) {
  const emails = database
    .prepare("SELECT subject, text FROM email_outbox WHERE to_address = ? AND subject LIKE 'Ganaste%'")
    .all(WINNER.email);

  const ticket = database
    .prepare(
      "SELECT t.number AS number FROM raffle_draws d JOIN raffle_tickets t ON t.number = d.ticket_number JOIN visitors v ON v.id = t.visitor_id WHERE v.gamertag = ?",
    )
    .get(WINNER.gamertag);

  check("Ganador queues one email to the winner", emails.length === 1, `${emails.length}`);

  // A delivered email has its text cleared; with the closed SMTP port it stays in the outbox with its text.
  const text = emails[0]?.text ?? "";

  check(
    "with the gamertag, the ticket number and the hour",
    text === "" || (text.includes(WINNER.gamertag) && text.includes(`#${ticket?.number}`) && /\d\d:\d\d/.test(text)),
    text.split("\n")[2] ?? "",
  );
}

async function checkPassportWin(page, prize, shot) {
  await page.goto(`${BASE_URL}/passport`, { waitUntil: "networkidle" });

  const notice = page.getByRole("heading", { name: "Ganaste" });

  await notice.waitFor({ timeout: UI_TIMEOUT_MS });
  check(
    prize ? "the passport shows the prize" : "the passport of the winner says Ganaste",
    prize ? await page.getByText(`Premio: ${prize}`).isVisible() : true,
  );
  await shot(page, prize ? "passport-prize" : "passport-win");
}

async function checkPublicWinners(page, prize) {
  await page.goto(`${BASE_URL}/raffle`, { waitUntil: "networkidle" });

  const body = await page.locator("main").textContent();

  check(
    prize ? "the public section shows the prize" : "the public section lists the winner",
    body.includes(WINNER.gamertag) && body.includes(prize ?? "Premio por entregar"),
  );
  check("and never the decoy that was discarded", !body.includes(DECOY_GAMERTAG));
}

async function registerThePrize({ pages, database, shot }) {
  await pages.other.reload({ waitUntil: "networkidle" });
  await pages.other.getByLabel("Premio entregado").fill(PRIZE);
  await pages.other.getByRole("button", { name: "Registrar premio" }).click();
  await pages.other.getByText(`Premio: ${PRIZE}`).waitFor({ timeout: UI_TIMEOUT_MS });

  const row = database
    .prepare("SELECT prize_name AS prize, prize_by_id AS byId FROM raffle_draws WHERE outcome = 'winner'")
    .get();

  const other = database.prepare("SELECT id FROM accounts WHERE email = ?").get(ANIMATOR_2.email);

  check("the other animator registers the prize, stored with who did it", row.prize === PRIZE && row.byId === other.id);
  await shot(pages.other, "admin-prize");
  await checkPassportWin(pages.phone, PRIZE, shot);
  await checkPublicWinners(pages.guest, PRIZE);
  await shot(pages.guest, "winners-page");
}

// The decoy and the winner already came out: their tickets are `drawn`. Three more visitors enter, and every spin
// until "No quedan boletos" draws one of those three, each one once.
async function checkDrawnVisitorsNeverReturn(page, database) {
  const leftOut = database
    .prepare(
      "SELECT COUNT(*) AS n FROM raffle_tickets t JOIN visitors v ON v.id = t.visitor_id WHERE v.gamertag IN (?, ?) AND t.status <> 'drawn'",
    )
    .get(DECOY_GAMERTAG, WINNER.gamertag).n;

  check("every ticket of a visitor that came out is drawn (out of the raffle)", leftOut === 0);

  const fresh = ["Rifa20002", "Rifa20003", "Rifa20004"];

  database
    .prepare(
      `UPDATE raffle_tickets SET status = 'active' WHERE status = 'voided' AND visitor_id IN (SELECT id FROM visitors WHERE gamertag IN (?, ?, ?))`,
    )
    .run(...fresh);

  const drawn = [];

  for (let round = 0; round < fresh.length; round += 1) {
    drawn.push(await spinAndDiscard(page));
  }

  check(
    "the next spins draw only visitors that had not come out, each one once",
    drawn.every((tag) => fresh.includes(tag)) && new Set(drawn).size === fresh.length,
    drawn.join(", "),
  );

  await waitForSpinEnabled(page);
  await page.getByRole("button", { name: "Girar" }).click();
  await page.getByText("No quedan boletos").waitFor({ timeout: UI_TIMEOUT_MS });
  check("with no active tickets the panel answers No quedan boletos", true);
}

async function spinAndDiscard(page) {
  await waitForSpinEnabled(page);
  await page.getByRole("button", { name: "Girar" }).click();

  const dialog = page.getByRole("alertdialog");

  await dialog.waitFor({ timeout: UI_TIMEOUT_MS });

  const gamertag = (await dialog.locator("p").first().textContent()).trim();

  await page.getByRole("button", { name: "Descartado" }).click();
  await dialog.waitFor({ state: "detached", timeout: UI_TIMEOUT_MS });

  return gamertag;
}

async function closeTheRaffle({ pages, database, shot }) {
  await pages.animator.getByRole("button", { name: "Cerrar la rifa" }).click();
  await pages.animator.getByRole("button", { name: "Sí, cerrar la rifa" }).click();
  await pages.animator.getByText(/La rifa se cerró a las/).waitFor({ timeout: UI_TIMEOUT_MS });
  check(
    "closing the raffle is stored",
    database.prepare("SELECT raffle_closed_at AS at FROM event_settings").get().at !== null,
  );
  check("and Girar stays disabled", await isSpinDisabled(pages.animator));
  await waitForStageText(pages.stage, "La rifa terminó. ¡Gracias por participar!");
  check("the stage screen says the raffle ended", true);
  await shot(pages.stage, "live-closed");
  await shot(pages.animator, "admin-closed");
}

async function checkMobileLayout(page, shot) {
  for (const [route, width] of [
    ["/raffle", 360],
    ["/raffle", 390],
    ["/raffle/live", 360],
  ]) {
    await page.setViewportSize({ width, height: 740 });
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });

    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

    check(`${route} has no horizontal scroll at ${width} px`, fits);
  }

  await shot(page, "live-mobile");
}

function checkAudit(database) {
  const actions = database
    .prepare("SELECT action, COUNT(*) AS n FROM audit_logs WHERE action LIKE 'raffle_%' GROUP BY action")
    .all()
    .reduce((all, row) => Object.assign(all, { [row.action]: row.n }), {});

  check(
    "every change is in the audit log (5 draws, 4 discarded, 1 winner, 1 prize, 1 closing)",
    actions.raffle_drawn === 5 &&
      actions.raffle_ticket_discarded === 4 &&
      actions.raffle_winner_confirmed === 1 &&
      actions.raffle_prize_registered === 1 &&
      actions.raffle_closed === 1,
    JSON.stringify(actions),
  );
}

async function isSpinDisabled(page) {
  return page.getByRole("button", { name: "Girar", includeHidden: true }).isDisabled();
}

async function waitForStage(stage, gamertag) {
  await waitForStageText(stage, gamertag);

  const text = await stage.locator("main").textContent();

  check(
    `the stage screen shows the ticket and ${gamertag} without reloading`,
    /#\d+/.test(text) && text.includes(gamertag),
  );
}

async function waitForStageText(stage, text) {
  await stage.getByText(text, { exact: true }).first().waitFor({ timeout: UI_TIMEOUT_MS });
}

function keepOnlyTicketsOf(database, gamertags) {
  const placeholders = gamertags.map(() => "?").join(", ");

  database
    .prepare(
      `UPDATE raffle_tickets SET status = 'voided' WHERE visitor_id NOT IN (SELECT id FROM visitors WHERE gamertag IN (${placeholders}))`,
    )
    .run(...gamertags);
}

function giveTicketTo(database, gamertag) {
  const visitor = database.prepare("SELECT id FROM visitors WHERE gamertag = ?").get(gamertag);

  database.prepare("INSERT INTO raffle_tickets (visitor_id, milestone) VALUES (?, 9)").run(visitor.id);
}

function toDatabaseDate(milliseconds) {
  return new Date(milliseconds).toISOString().replace("Z", "+00:00");
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

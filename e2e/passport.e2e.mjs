// End-to-end check of /passport in a real browser: npm run test:e2e
//
// Creates its own SQLite database in the system temp dir, seeds it, starts `next dev` on E2E_PORT and
// removes everything when it finishes. Visits are recorded with SQL until the kiosk exists (M5); the
// milestone rule mirrors grantMilestoneTickets, which the Jest suite covers.
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

const PORT = Number(process.env.E2E_PORT ?? 3460);

const BASE_URL = `http://localhost:${PORT}`;

const GAMERTAG = "e2e_neo";

const EMAIL = "e2e-neo@example.test";

const SERVER_READY_TIMEOUT_MS = 180_000;

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
  const workdir = mkdtempSync(path.join(tmpdir(), "ut-e3-e2e-"));
  const screenshots = process.env.E2E_SCREENSHOTS_DIR ?? path.join(ROOT, "e2e", "screenshots");
  mkdirSync(screenshots, { recursive: true });

  const env = buildEnvironment(workdir);
  const databaseFile = path.join(workdir, "e2e.db");
  prepareDatabase(env, databaseFile);

  const server = startDevServer(env, path.join(workdir, "dev.log"));
  let browser;

  try {
    await waitForServer();
    browser = await launchBrowser();
    await runScenario(browser, databaseFile, screenshots);
  } finally {
    await browser?.close();
    server.kill();
  }

  const failed = results.filter((result) => !result.ok);
  const summary = `\n${results.length - failed.length}/${results.length} checks passed.`;

  console.log(`Screenshots: ${screenshots}`);

  if (failed.length === 0 && !process.env.E2E_KEEP_FILES) {
    rmSync(workdir, { recursive: true, force: true });
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
  };
}

function prepareDatabase(env, databaseFile) {
  runNpmScript("db:deploy", env);
  runNpmScript("db:seed", env);

  // The seed closes registration until November 13; the scenario runs before that date.
  const database = new DatabaseSync(databaseFile);
  database.prepare("UPDATE event_settings SET registration_opens_at = ?").run("2026-10-01T00:00:00.000+00:00");
  database.close();
}

// npm sets npm_execpath when it runs this script (`npm run test:e2e`), so the same npm CLI runs the seeds.
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
  const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  try {
    const session = { page, screenshots };

    await expectRedirectWithoutDevice(page);
    await registerVisitor(page);
    await checkPassport(session, "360 px 0 visits", ZERO_VISITS);
    await checkPassport(session, "360 px 9 visits", nineVisits(database));
    await checkPassport(session, "360 px 16 visits", sixteenVisits(database));
    await checkPassport(session, "360 px 18 visits", eighteenVisits(database));
    await checkCompletePassportAtOtherWidths(page, screenshots);
    checkTicketsInDatabase(database);
  } finally {
    check("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");
    await context.close();
    database.close();
  }
}

// Visit scenarios are cumulative: each one adds visits to the same visitor and then checks the page.
const ZERO_VISITS = {
  progress: "Te faltan 9 visitas para tu siguiente boleto.",
  bar: "0",
  summary: "Visitados 0 de 18",
  visited: 0,
  tickets: 0,
  emptyTicketsText: "Aún no tienes boletos. Se otorgan al llegar a 9 y a 18 visitas.",
};

function nineVisits(database) {
  seedVisits(database, 9);

  return {
    progress: "Te faltan 9 visitas para tu siguiente boleto.",
    bar: "0",
    summary: "Visitados 9 de 18",
    visited: 9,
    tickets: 1,
  };
}

function sixteenVisits(database) {
  seedVisits(database, 7);

  return {
    progress: "Te faltan 2 visitas para tu siguiente boleto.",
    bar: "78",
    summary: "Visitados 16 de 18",
    visited: 16,
    tickets: 1,
  };
}

function eighteenVisits(database) {
  seedVisits(database, 2);

  return {
    progress: "Ya tienes tus dos boletos. ¡Gracias por visitarnos!",
    bar: "100",
    summary: "Visitados 18 de 18",
    visited: 18,
    tickets: 2,
  };
}

async function expectRedirectWithoutDevice(page) {
  await page.goto(`${BASE_URL}/passport`, { waitUntil: "networkidle" });
  await page.waitForURL(/\/register$/, { timeout: 20_000 });
  check("no device cookie -> /register", page.url().endsWith("/register"), page.url());
}

async function registerVisitor(page) {
  await page.getByLabel("Nombre completo").fill("E2E Neo");
  await page.getByLabel("Gamertag").fill(GAMERTAG);
  await page.getByLabel("Correo electrónico").fill(EMAIL);
  await page.getByRole("button", { name: "Registrar pasaporte" }).click();
  await page.waitForURL(/\/passport$/, { timeout: 30_000 });

  const pin = (await page.locator("p.type-mono").first().textContent()).trim();
  check("registration -> /passport with a five-digit PIN", /^\d{5}$/.test(pin), pin);
}

async function checkPassport(session, label, expected) {
  const { page, screenshots } = session;

  await page.reload({ waitUntil: "networkidle" });

  // textContent, not innerText: the type-tiny styles are uppercase, and innerText returns the rendered case.
  const progress = (await page.locator("section p.type-tiny").first().textContent()).trim();
  check(`${label}: progress text`, progress === expected.progress, `"${progress}"`);

  const bar = await page
    .getByRole("progressbar", { name: "Progreso hacia el siguiente boleto" })
    .getAttribute("aria-valuenow");

  check(`${label}: progressbar value`, bar === expected.bar, `aria-valuenow=${bar}`);

  const summary = (await page.getByText(/^Visitados \d+ de 18$/).textContent()).trim();
  check(`${label}: stands summary`, summary === expected.summary, `"${summary}"`);

  await checkStandItems(page, label, expected.visited);
  await checkTickets(page, label, expected);
  await checkNoHorizontalScroll(page, label);

  await page.screenshot({ path: path.join(screenshots, `${slugify(label)}.png`), fullPage: true });
}

async function checkStandItems(page, label, visitedCount) {
  const items = await page.locator("ul.grid > li").allTextContents();
  const visited = items.filter((text) => text.includes("Visitado") && !text.includes("Pendiente"));

  check(`${label}: 18 stand items listed`, items.length === 18, `count=${items.length}`);
  check(`${label}: visited stand items`, visited.length === visitedCount, `count=${visited.length}`);
}

async function checkTickets(page, label, expected) {
  const tickets = await page.getByText(/^Boleto #\d+$/).allTextContents();

  check(`${label}: tickets listed`, tickets.length === expected.tickets, tickets.join(", ") || "none");

  if (expected.emptyTicketsText) {
    check(`${label}: empty tickets text`, (await page.getByText(expected.emptyTicketsText).count()) === 1);
  }
}

async function checkNoHorizontalScroll(page, label) {
  const [scrollWidth, innerWidth] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    window.innerWidth,
  ]);

  check(
    `${label}: no horizontal scroll`,
    scrollWidth <= innerWidth,
    `scrollWidth=${scrollWidth} innerWidth=${innerWidth}`,
  );
}

async function checkCompletePassportAtOtherWidths(page, screenshots) {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.reload({ waitUntil: "networkidle" });
    await checkNoHorizontalScroll(page, `18 visits at ${width} px`);
    await page.screenshot({ path: path.join(screenshots, `${width}-px-18-visits.png`), fullPage: true });
  }
}

function checkTicketsInDatabase(database) {
  const tickets = database.prepare("SELECT milestone FROM raffle_tickets ORDER BY number").all();
  const milestones = tickets.map((ticket) => ticket.milestone).join(",");

  check("tickets in the database: milestones 9 then 18", milestones === "9,18", milestones);
}

// Stand-in for the kiosk (M5): records visits on the first free stands, then applies the milestone rule.
function seedVisits(database, count) {
  const visitorId = database.prepare("SELECT id FROM visitors WHERE gamertag = ?").get(GAMERTAG).id;

  const visited = new Set(
    database
      .prepare("SELECT stand_id AS standId FROM checkins WHERE visitor_id = ?")
      .all(visitorId)
      .map((row) => row.standId),
  );

  const freeStands = database
    .prepare("SELECT id FROM stands ORDER BY zone, number")
    .all()
    .map((row) => row.id)
    .filter((standId) => !visited.has(standId))
    .slice(0, count);

  for (const standId of freeStands) {
    database
      .prepare("INSERT INTO checkins (id, visitor_id, stand_id) VALUES (?, ?, ?)")
      .run(randomUUID(), visitorId, standId);
  }

  grantMilestoneTickets(database, visitorId);
}

function grantMilestoneTickets(database, visitorId) {
  const { count } = database.prepare("SELECT COUNT(*) AS count FROM checkins WHERE visitor_id = ?").get(visitorId);

  for (const milestone of [9, 18]) {
    const held = database
      .prepare("SELECT 1 FROM raffle_tickets WHERE visitor_id = ? AND milestone = ?")
      .get(visitorId, milestone);

    if (count >= milestone && !held) {
      database.prepare("INSERT INTO raffle_tickets (visitor_id, milestone) VALUES (?, ?)").run(visitorId, milestone);
    }
  }
}

function check(name, ok, detail = "") {
  const status = ok ? "PASS" : "FAIL";
  const suffix = detail ? ` -- ${detail}` : "";

  results.push({ name, ok: Boolean(ok) });
  console.log(`${status} ${name}${suffix}`);
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

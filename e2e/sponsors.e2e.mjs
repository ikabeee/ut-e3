// End-to-end check of the sponsors page /sponsors and the sponsors carousel of the landing in a real browser:
// npm run test:e2e:sponsors
//
// Creates its own SQLite database in the system temp dir, seeds it (the example sponsors of INITIAL_SPONSORS), starts
// `next dev` on E2E_PORT and removes everything when it finishes. Flows SP-01 to SP-06 of odd/tasks/sponsors-page.md
// (S6). The expected sponsors are read from that database, so the flows keep passing when the seed changes.
//
// Browser: set E2E_CHROMIUM_PATH to an installed Chromium, or run `npx playwright-core install chromium`
// (https://playwright.dev/docs/browsers) and leave it unset. Screenshots and http.log go to e2e/screenshots/sponsors
// (not versioned; override with E2E_SCREENSHOTS_DIR). E2E_KEEP_FILES=1 keeps the database and the server log; they
// are also kept when a check fails.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, openSync, rmSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const NEXT_CLI = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

const PORT = Number(process.env.E2E_PORT ?? 3471);

const BASE_URL = `http://localhost:${PORT}`;

const SERVER_READY_TIMEOUT_MS = 180_000;

const READABLE_MEXICAN_PHONE = /^\d{3} \d{3} \d{4}$/;

const VIEWPORTS = [
  { label: "360", width: 360, height: 780 },
  { label: "390", width: 390, height: 844 },
  { label: "844-landscape", width: 844, height: 390 },
  { label: "1440", width: 1440, height: 900 },
];

const MIN_TOUCH_TARGET_PX = 44;

const results = [];

const httpLog = [];

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
  const workdir = mkdtempSync(path.join(tmpdir(), "ut-e3-e2e-sponsors-"));
  const screenshots = process.env.E2E_SCREENSHOTS_DIR ?? path.join(ROOT, "e2e", "screenshots", "sponsors");
  mkdirSync(screenshots, { recursive: true });

  const env = buildEnvironment(workdir);
  prepareDatabase(env);
  const sponsors = readSponsors(path.join(workdir, "e2e.db"));

  const server = startDevServer(env, path.join(workdir, "dev.log"));
  let browser;

  try {
    await waitForServer();
    browser = await launchBrowser();
    await runScenario(browser, sponsors, screenshots);
  } finally {
    await browser?.close();
    server.kill();
    reportHttp(screenshots);
  }

  return reportResults(workdir, screenshots);
}

function buildEnvironment(workdir) {
  return {
    ...process.env,
    DATABASE_URL: `file:${path.join(workdir, "e2e.db")}`,
    PIN_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    NEXT_PUBLIC_SITE_URL: BASE_URL,
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

function prepareDatabase(env) {
  runNpmScript("db:deploy", env);
  runNpmScript("db:seed", env);
}

// npm sets npm_execpath when it runs this script (`npm run test:e2e:sponsors`), so the same npm CLI runs the seeds.
function runNpmScript(name, env) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, "run", name], { env, stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`npm run ${name} failed with exit code ${result.status}`);
  }
}

function readSponsors(databaseFile) {
  const database = new DatabaseSync(databaseFile);

  try {
    return database
      .prepare(
        `SELECT name, logo_path AS logoPath, website_url AS websiteUrl, phone, services
         FROM sponsors ORDER BY position`,
      )
      .all();
  } finally {
    database.close();
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
      const response = await fetch(`${BASE_URL}/privacy`, { redirect: "manual" });

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

async function runScenario(browser, sponsors, screenshots) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const consoleErrors = watchPage(page);
  const session = { page, sponsors, screenshots };

  try {
    check("seed has example sponsors", sponsors.length > 0, `count=${sponsors.length}`);
    await checkCards(session);
    await checkLogos(session);
    await checkWebsiteLinks(session);
    await checkPhoneLinks(session);
    await checkLandingCarousel(session);
    await checkViewports(session);
  } finally {
    check("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");
    await context.close();
  }
}

function watchPage(page) {
  const consoleErrors = [];

  page.on("response", (response) => {
    if (response.request().resourceType() === "document") {
      recordHttp(response);
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  return consoleErrors;
}

function recordHttp(response) {
  const headers = response.headers();

  httpLog.push(
    `${response.request().method()} ${response.url()} -> ${response.status()}` +
      ` | content-type: ${headers["content-type"] ?? "-"} | cache-control: ${headers["cache-control"] ?? "-"}`,
  );
}

// SP-01: /sponsors answers 200, has its canonical URL and shows one card per sponsor, in position order, with its
// name and services.
async function checkCards(session) {
  const { page, sponsors } = session;
  const response = await openSponsorsPage(page);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  const names = await sponsorCards(page).getByRole("heading", { level: 2 }).allTextContents();
  const body = await bodyText(page);
  const missingServices = sponsors.filter((sponsor) => !body.includes(sponsor.services)).map(({ name }) => name);

  check("SP-01 /sponsors answers 200", response?.status() === 200, `status=${response?.status()}`);
  check("SP-01 canonical URL is /sponsors", canonical === `${BASE_URL}/sponsors`, `canonical=${canonical}`);
  check(
    "SP-01 one card per sponsor in position order",
    JSON.stringify(names) === JSON.stringify(sponsors.map(({ name }) => name)),
    names.join(", "),
  );
  check("SP-01 every card shows its services", missingServices.length === 0, missingServices.join(", ") || "none");
  await screenshot(session, "01-cards/01-sponsors-page");
}

// SP-02: every logo loads (naturalWidth > 0) and its alt is the sponsor name.
async function checkLogos(session) {
  const { page, sponsors } = session;

  const logos = await sponsorCards(page)
    .getByRole("img")
    .evaluateAll((images) =>
      images.map((image) => ({ alt: image.alt, src: image.getAttribute("src"), loaded: image.naturalWidth > 0 })),
    );

  const broken = logos.filter((logo) => !logo.loaded).map(({ alt }) => alt);

  check(
    "SP-02 one logo per sponsor, with its name as alt",
    JSON.stringify(logos.map(({ alt }) => alt)) === JSON.stringify(sponsors.map(({ name }) => name)),
  );
  check(
    "SP-02 logos come from logo_path",
    logos.every((logo, index) => logo.src === sponsors[index]?.logoPath),
    logos.map(({ src }) => src).join(", "),
  );
  check("SP-02 every logo loads", broken.length === 0, broken.join(", ") || "none");
}

// SP-03 (RF-48): the website opens in a new tab with rel="noopener noreferrer".
async function checkWebsiteLinks(session) {
  const { page, sponsors } = session;
  const links = await linkAttributes(sponsorCards(page).getByRole("link", { name: /Visitar sitio/ }));

  check(
    "SP-03 website href of every sponsor",
    JSON.stringify(links.map(({ href }) => href)) === JSON.stringify(sponsors.map(({ websiteUrl }) => websiteUrl)),
  );
  check(
    "SP-03 target=_blank",
    links.every(({ target }) => target === "_blank"),
  );
  check(
    "SP-03 rel=noopener noreferrer",
    links.every(({ rel }) => rel === "noopener noreferrer"),
  );
}

// SP-04 (RF-48): the phone is a tel: link shown in a readable format.
async function checkPhoneLinks(session) {
  const { page, sponsors } = session;
  const links = await linkAttributes(sponsorCards(page).locator('a[href^="tel:"]'));

  check(
    "SP-04 tel: href of every sponsor",
    JSON.stringify(links.map(({ href }) => href)) === JSON.stringify(sponsors.map(({ phone }) => `tel:${phone}`)),
    links.map(({ href }) => href).join(", "),
  );
  check(
    "SP-04 phone shown as 998 000 0000",
    links.every(({ text }) => READABLE_MEXICAN_PHONE.test(text)),
    links.map(({ text }) => text).join(", "),
  );
  await screenshot(session, "02-links/01-sponsors-page");
}

// SP-05: the landing carousel shows the same sponsors and opens on the first one.
async function checkLandingCarousel(session) {
  const { page, sponsors } = session;
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  const carousel = page.locator("#sponsors");
  const current = await carousel.getByRole("heading", { level: 2 }).textContent();
  const slides = await carousel.locator('[aria-roledescription="diapositiva"]').count();

  check("SP-05 landing carousel opens on the first sponsor", current === sponsors[0]?.name, `heading=${current}`);
  check("SP-05 one slide per sponsor", slides === sponsors.length, `slides=${slides}`);
  await carousel.scrollIntoViewIfNeeded();
  await carousel.screenshot({ path: screenshotPath(session, "03-landing-carousel/01-sponsors-section") });
}

// SP-06: no horizontal scroll and 44x44 px touch targets at phone, landscape and desktop widths.
async function checkViewports(session) {
  const { page } = session;

  for (const [index, viewport] of VIEWPORTS.entries()) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openSponsorsPage(page);
    const label = `SP-06 ${viewport.label}`;
    await checkNoHorizontalScroll(page, label);
    await checkTouchTarget(sponsorCards(page).getByRole("link", { name: /Visitar sitio/ }), label, "Visitar sitio");
    await checkTouchTarget(sponsorCards(page).locator('a[href^="tel:"]'), label, "teléfono");
    await screenshot(session, `04-viewports/${String(index + 1).padStart(2, "0")}-${viewport.label}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
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

async function checkTouchTarget(locator, label, name) {
  const box = await locator.first().boundingBox();
  const ok = box !== null && box.width >= MIN_TOUCH_TARGET_PX && box.height >= MIN_TOUCH_TARGET_PX;

  check(
    `${label}: "${name}" is at least 44x44 px`,
    ok,
    box ? `${Math.round(box.width)}x${Math.round(box.height)}` : "",
  );
}

async function openSponsorsPage(page) {
  return page.goto(`${BASE_URL}/sponsors`, { waitUntil: "networkidle" });
}

function sponsorCards(page) {
  return page.getByRole("list", { name: "Patrocinadores del evento" });
}

function linkAttributes(locator) {
  return locator.evaluateAll((links) =>
    links.map((link) => ({
      href: link.getAttribute("href"),
      target: link.getAttribute("target"),
      rel: link.getAttribute("rel"),
      text: link.textContent?.trim() ?? "",
    })),
  );
}

// textContent, not innerText: the type-* utilities uppercase the text, and innerText returns the rendered case.
async function bodyText(page) {
  return (await page.locator("body").textContent()) ?? "";
}

// Full-page captures start from the top: a page scrolled down repaints its sticky navbar in the middle of the image.
async function screenshot(session, name) {
  await session.page.evaluate(() => window.scrollTo(0, 0));
  await session.page.screenshot({ path: screenshotPath(session, name), fullPage: true });
}

// One numbered folder per flow, in the order the run visits them: 01-cards/01-sponsors-page.png, ...
function screenshotPath(session, name) {
  const file = path.join(session.screenshots, `${name}.png`);

  mkdirSync(path.dirname(file), { recursive: true });

  return file;
}

function reportHttp(screenshots) {
  console.log("\nHTTP");

  for (const line of httpLog) {
    console.log(line);
  }

  writeFileSync(path.join(screenshots, "http.log"), `${httpLog.join("\n")}\n`);
}

function reportResults(workdir, screenshots) {
  const failed = results.filter((result) => !result.ok);
  const summary = `\n${results.length - failed.length}/${results.length} checks passed.`;

  console.log(`\nScreenshots and http.log: ${screenshots}`);

  if (failed.length === 0 && !process.env.E2E_KEEP_FILES) {
    rmSync(workdir, { recursive: true, force: true });
    console.log(summary);
  } else {
    console.log(`${summary} Database and server log kept in ${workdir}`);
  }

  return failed.length === 0 ? 0 : 1;
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

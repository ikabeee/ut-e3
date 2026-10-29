// End-to-end check of the game page /games/[slug] in a real browser: npm run test:e2e:games
//
// Creates its own SQLite database in the system temp dir, seeds it, starts `next dev` on E2E_PORT and removes
// everything when it finishes. Flows G-01 to G-08 of odd/tasks/game-detail.md (S5).
//
// getEventSettings() is cached inside the dev server, so the itch.io opening time is written before the first
// request that reads the settings: readiness is polled on /privacy, which does not read them.
//
// Browser: set E2E_CHROMIUM_PATH to an installed Chromium, or run `npx playwright-core install chromium`
// (https://playwright.dev/docs/browsers) and leave it unset. Screenshots and http.log go to e2e/screenshots/games
// (not versioned; override with E2E_SCREENSHOTS_DIR). E2E_KEEP_FILES=1 keeps the database and the server log; they
// are also kept when a check fails.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, openSync, rmSync, writeFileSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const NEXT_CLI = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

const PORT = Number(process.env.E2E_PORT ?? 3470);

const BASE_URL = `http://localhost:${PORT}`;

const SERVER_READY_TIMEOUT_MS = 180_000;

const ITCH_LEAD_MS = 90_000;

const ITCH_OPEN_MARGIN_MS = 2000;

const FEATURED_SLUG = "ceniza-protocol";

const FEATURED_ITCH_URL = "https://utg.itch.io/ceniza-protocol";

const EXTRA_IMAGE_PATHS = ["/games/cenote.jpg", "/games/circuito-7.jpg", "/games/eco-nulo.jpg", "/games/hormigon.jpg"];

const FULL_STAND_CODE = /Z[A-Z]-S\d+-E\d+-/;

const VIEWPORTS = [
  { label: "360", width: 360, height: 780 },
  { label: "390", width: 390, height: 844 },
  { label: "844-landscape", width: 844, height: 390 },
  { label: "1440", width: 1440, height: 900 },
];

const MIN_TOUCH_TARGET_PX = 44;

const MODAL_ANIMATION_CAP_MS = 3000;

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
  const workdir = mkdtempSync(path.join(tmpdir(), "ut-e3-e2e-games-"));
  const screenshots = process.env.E2E_SCREENSHOTS_DIR ?? path.join(ROOT, "e2e", "screenshots", "games");
  mkdirSync(screenshots, { recursive: true });

  const env = buildEnvironment(workdir);
  const databaseFile = path.join(workdir, "e2e.db");
  prepareDatabase(env);

  const server = startDevServer(env, path.join(workdir, "dev.log"));
  let browser;

  try {
    await waitForServer();
    const fixture = prepareFixture(databaseFile);
    browser = await launchBrowser();
    await runScenario(browser, fixture, screenshots);
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

// npm sets npm_execpath when it runs this script (`npm run test:e2e:games`), so the same npm CLI runs the seeds.
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

// /privacy does not read the event settings, so polling it keeps their cache empty.
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

// Writes the itch.io scenario before any request reads the cached settings, and returns what the flows expect.
function prepareFixture(databaseFile) {
  const database = new DatabaseSync(databaseFile);

  try {
    const itchOpensAt = nextWholeMinute(Date.now() + ITCH_LEAD_MS);
    writeItchOpensAt(database, itchOpensAt);
    database.prepare("UPDATE games SET itch_url = ? WHERE slug = ?").run(FEATURED_ITCH_URL, FEATURED_SLUG);

    const featured = readGame(database, FEATURED_SLUG);
    const extraAlts = addGalleryImages(database, featured);

    return {
      itchOpensAt,
      featured: { ...featured, alts: [featured.coverAlt, ...extraAlts] },
      coverflowGame: readMiddleGame(database),
      withoutLink: readGameWithoutLink(database),
    };
  } finally {
    database.close();
  }
}

// A whole minute keeps the HH:MM on the page unambiguous (no seconds to round or truncate).
function nextWholeMinute(timestamp) {
  return new Date(Math.ceil(timestamp / 60_000) * 60_000);
}

// Prisma stores DateTime in SQLite as the seed wrote it; the new value follows the same format.
function writeItchOpensAt(database, itchOpensAt) {
  const { current } = database.prepare("SELECT itch_opens_at AS current FROM event_settings WHERE id = 1").get();
  const value = formatLike(current, itchOpensAt);

  database.prepare("UPDATE event_settings SET itch_opens_at = ? WHERE id = 1").run(value);
  console.log(`itch_opens_at: seeded ${JSON.stringify(current)} -> ${JSON.stringify(value)}`);
}

function formatLike(sample, date) {
  const text = String(sample);

  if (/^\d+$/.test(text)) {
    return date.getTime();
  }

  const iso = date.toISOString();

  return text.endsWith("+00:00") ? iso.replace("Z", "+00:00") : iso;
}

function readGame(database, slug) {
  return database
    .prepare(
      `SELECT g.id, g.slug, g.name, g.synopsis, ge.name AS genre, s.zone, s.number, i.alt AS coverAlt
       FROM games g
       JOIN genres ge ON ge.id = g.genre_id
       JOIN stands s ON s.id = g.stand_id
       JOIN game_images i ON i.game_id = g.id AND i.is_cover = 1
       WHERE g.slug = ?`,
    )
    .get(slug);
}

function addGalleryImages(database, game) {
  return EXTRA_IMAGE_PATHS.map((imagePath, index) => {
    const position = index + 2;
    const alt = `Captura ${position} de ${game.name}`;

    database
      .prepare("INSERT INTO game_images (id, game_id, path, alt, position, is_cover) VALUES (?, ?, ?, ?, ?, 0)")
      .run(randomUUID(), game.id, imagePath, alt, position);

    return alt;
  });
}

// The coverflow opens on the middle game in stand order: the 9th of the 18 seeded games.
function readMiddleGame(database) {
  const { count } = database.prepare("SELECT COUNT(*) AS count FROM games").get();

  return database
    .prepare(
      `SELECT g.slug, g.name FROM games g JOIN stands s ON s.id = g.stand_id
       ORDER BY s.zone, s.number LIMIT 1 OFFSET ?`,
    )
    .get(Math.ceil(count / 2) - 1);
}

function readGameWithoutLink(database) {
  return database
    .prepare(
      `SELECT g.slug, g.name FROM games g JOIN stands s ON s.id = g.stand_id
       WHERE g.itch_url IS NULL ORDER BY s.zone, s.number LIMIT 1`,
    )
    .get();
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

async function runScenario(browser, fixture, screenshots) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const consoleErrors = watchPage(page);
  const session = { page, fixture, screenshots };

  try {
    await checkItchPending(session);
    await checkCatalogToGamePage(session);
    await checkGallery(session);
    await checkUnknownSlug(session);
    await checkShortCodeOnly(session);
    await waitUntil(fixture.itchOpensAt.getTime() + ITCH_OPEN_MARGIN_MS);
    await checkItchOpen(session);
    await checkGameWithoutLink(session);
    await checkViewports(session);
  } finally {
    check("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");
    await context.close();
  }
}

// Records every document response for the HTTP evidence and collects console errors. The 404 of G-06 is expected.
function watchPage(page) {
  const consoleErrors = [];

  page.on("response", (response) => {
    if (response.request().resourceType() === "document") {
      recordHttp(response);
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("404")) {
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

// G-03: before itchOpensAt the page states the activation time and shows no link.
async function checkItchPending(session) {
  const { page, fixture } = session;
  const expected = `El enlace a itch.io se activa a las ${cancunTime(fixture.itchOpensAt)}.`;

  check("G-03 runs before itchOpensAt", Date.now() < fixture.itchOpensAt.getTime(), fixture.itchOpensAt.toISOString());
  await openGamePage(page, FEATURED_SLUG);

  const body = await bodyText(page);
  check("G-03 pending text with the activation time", body.includes(expected), expected);
  check("G-03 no itch.io link", (await page.locator('a[href*="itch.io"]').count()) === 0);
  await screenshot(session, "g03-itch-pending");
}

function cancunTime(date) {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Cancun",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

// G-01: tapping the game at the center of the landing coverflow opens its page in a modal and closing it returns to
// the landing; loading the page directly shows the full page with the navbar ("Inicio" only, S6).
async function checkCatalogToGamePage(session) {
  const { page, fixture } = session;

  await openCoverflowModal(session, fixture.coverflowGame);
  await closeModal(session, fixture.coverflowGame);
  await openGamePage(page, fixture.featured.slug);
  await checkGameData(page, fixture.featured);
  await checkNavbar(page);
  await screenshot(session, "g01-game-detail");
}

async function openCoverflowModal(session, game) {
  const { page } = session;
  const gamePath = `/games/${game.slug}`;

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  const caseLink = page.locator("#games").getByRole("link", { name: new RegExp(`^${escapeRegExp(game.name)},`) });
  await caseLink.scrollIntoViewIfNeeded();
  await screenshot(session, "g01-landing-coverflow");

  check('G-01 no "Ver ficha" button', (await page.getByText("Ver ficha").count()) === 0);
  check("G-01 the center case links to its game", (await caseLink.getAttribute("href")) === gamePath, gamePath);

  await caseLink.click();
  const dialog = page.getByRole("dialog", { name: game.name });
  await dialog.waitFor({ timeout: 30_000 });
  check("G-01 the click opens the game in a modal", await dialog.isVisible(), game.name);
  check("G-01 the modal URL is the game page", new URL(page.url()).pathname === gamePath, page.url());
  await waitForModalAnimations(page);
  await screenshot(session, "g01-modal");
}

async function closeModal(session, game) {
  const { page } = session;

  await page.getByRole("button", { name: "Cerrar" }).click();
  await page.getByRole("dialog").waitFor({ state: "detached", timeout: 30_000 });
  check("G-01 closing the modal returns to the landing", new URL(page.url()).pathname === "/", page.url());

  await page
    .waitForFunction(() => document.activeElement?.tagName === "A", undefined, { timeout: 5000 })
    .catch(() => {});
  const focusedHref = await page.evaluate(() => document.activeElement?.getAttribute("href"));
  check("G-01 the focus goes back to the game case", focusedHref === `/games/${game.slug}`, focusedHref ?? "none");
  await screenshot(session, "g01-modal-closed");
}

async function checkNavbar(page) {
  const links = page.getByRole("navigation").getByRole("link");
  const labels = (await links.allTextContents()).map((label) => label.trim()).filter(Boolean);
  const inicio = page.getByRole("navigation").getByRole("link", { name: "Inicio", exact: true });

  check("G-01 the navbar only lists Inicio", labels.join(",") === "Inicio", labels.join(",") || "none");
  check("G-01 Inicio goes to /", (await inicio.getAttribute("href")) === "/");
  check('G-01 no "Volver al catálogo" link', (await page.getByText("Volver al catálogo").count()) === 0);
}

// The modal fades in with CSS animations; a screenshot taken before they finish shows it transparent. Only the modal's
// own animations are awaited (the landing runs endless ones), and the wait is capped so it can never hang the run.
async function waitForModalAnimations(page) {
  await page.evaluate(
    (capMs) =>
      Promise.race([
        Promise.all(
          document
            .getAnimations()
            .filter((animation) => animation.effect?.target?.closest?.(".modal__backdrop"))
            .map((animation) => animation.finished),
        ),
        new Promise((resolve) => setTimeout(resolve, capMs)),
      ]),
    MODAL_ANIMATION_CAP_MS,
  );
}

function escapeRegExp(text) {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

async function checkGameData(page, game) {
  const heading = (await page.getByRole("heading", { level: 1 }).textContent())?.trim();
  check("G-01 h1 is the game name", heading === game.name, `"${heading}"`);

  const genre = await definitionFor(page, "Género");
  check("G-01 genre", genre === game.genre, `"${genre}"`);

  const stand = await definitionFor(page, "Stand");
  const shortCode = `Z${game.zone}-S${game.number}`;
  check("G-01 stand short code", stand === shortCode, `"${stand}"`);

  check("G-01 synopsis", (await bodyText(page)).includes(game.synopsis));

  const title = await page.title();
  check("G-01 <title> contains the name", title.includes(game.name), `"${title}"`);

  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  check("G-01 canonical URL", Boolean(canonical?.endsWith(`/games/${game.slug}`)), canonical ?? "none");
}

async function definitionFor(page, term) {
  const definition = page.locator("dl dt", { hasText: term }).locator("xpath=following-sibling::dd[1]");

  return (await definition.textContent())?.trim();
}

// G-02: the gallery lists the cover first and then the images by position, all with alt text.
async function checkGallery(session) {
  const { page, fixture } = session;
  const gallery = page.getByRole("list", { name: "Galería" });
  const alts = await gallery.locator("img").evaluateAll((images) => images.map((image) => image.alt));

  check("G-02 gallery has 5 images", alts.length === 5, `count=${alts.length}`);
  check("G-02 cover first", alts[0] === fixture.featured.coverAlt, `"${alts[0]}"`);
  check("G-02 cover then by position", alts.join("|") === fixture.featured.alts.join("|"), alts.join(" | "));
  check(
    "G-02 every image has alt text",
    alts.every((alt) => alt.trim().length > 0),
  );

  await gallery.scrollIntoViewIfNeeded();
  await screenshot(session, "g02-gallery");
}

// G-06: an unknown slug shows the not-found page with noindex. With Cache Components the first visit gets the App
// Shell before notFound() streams, so the status is 200 on that visit and 404 once cached (S4, L7 of game-detail).
async function checkUnknownSlug(session) {
  const { page } = session;
  const response = await page.goto(`${BASE_URL}/games/no-existe`, { waitUntil: "networkidle" });
  const status = response?.status();
  const robots = await page.locator('meta[name="robots"]').first().getAttribute("content");
  const notFoundText = await page.getByText("This page could not be found.").count();

  check("G-06 unknown slug answers 200 or 404", status === 200 || status === 404, `status=${status}`);
  check("G-06 not-found page is shown", notFoundText > 0, `matches=${notFoundText}`);
  check("G-06 not-found page has noindex", robots?.includes("noindex") === true, `robots=${robots}`);
  await screenshot(session, "g06-not-found");
}

// G-07: the visitor sees the short stand code, never the full one.
async function checkShortCodeOnly(session) {
  const { page } = session;

  await openGamePage(page, FEATURED_SLUG);
  const match = (await bodyText(page)).match(FULL_STAND_CODE);
  check("G-07 no full stand code on the page", match === null, match?.[0] ?? "none");
  await screenshot(session, "g07-short-code");
}

// G-04: from itchOpensAt on, the page links to itch.io in a new tab.
async function checkItchOpen(session) {
  const { page } = session;

  await openGamePage(page, FEATURED_SLUG);
  const link = page.getByRole("link", { name: "Jugar en itch.io" });
  const count = await link.count();
  check("G-04 itch.io link present", count === 1, `count=${count}`);

  if (count === 1) {
    check("G-04 href", (await link.getAttribute("href")) === FEATURED_ITCH_URL, await link.getAttribute("href"));
    check("G-04 target=_blank", (await link.getAttribute("target")) === "_blank");
    check("G-04 rel=noopener noreferrer", (await link.getAttribute("rel")) === "noopener noreferrer");
  }

  check("G-04 pending text gone", !(await bodyText(page)).includes("El enlace a itch.io se activa"));
  await screenshot(session, "g04-itch-open");
}

// G-05: a game without itch_url shows neither the pending text nor the link, even after itchOpensAt.
async function checkGameWithoutLink(session) {
  const { page, fixture } = session;

  await openGamePage(page, fixture.withoutLink.slug);
  const body = await bodyText(page);
  const links = await page.locator('a[href*="itch.io"]').count();

  check(`G-05 ${fixture.withoutLink.slug}: no pending text`, !body.includes("El enlace a itch.io se activa"));
  check(`G-05 ${fixture.withoutLink.slug}: no itch.io link`, links === 0, `count=${links}`);
  await screenshot(session, "g05-without-link");
}

// G-08: no horizontal scroll and 44x44 px touch targets at phone, landscape and desktop widths, on the full page and
// in the modal.
async function checkViewports(session) {
  const { page, fixture } = session;

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openGamePage(page, FEATURED_SLUG);
    await checkNoHorizontalScroll(page, viewport.label);
    await checkTouchTarget(
      page.getByRole("navigation").getByRole("link", { name: "Inicio", exact: true }),
      viewport.label,
      "Inicio",
    );
    await checkTouchTarget(page.getByRole("link", { name: "Jugar en itch.io" }), viewport.label, "Jugar en itch.io");
    await screenshot(session, `g08-${viewport.label}`);
    await checkModalViewport(session, fixture.coverflowGame, viewport.label);
  }
}

async function checkModalViewport(session, game, label) {
  const { page } = session;

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  const caseLink = page.locator("#games").getByRole("link", { name: new RegExp(`^${escapeRegExp(game.name)},`) });
  await caseLink.scrollIntoViewIfNeeded();
  await caseLink.click();
  await page.getByRole("dialog", { name: game.name }).waitFor({ timeout: 30_000 });
  await checkNoHorizontalScroll(page, `${label} modal`);
  await checkTouchTarget(page.getByRole("button", { name: "Cerrar" }), `${label} modal`, "Cerrar");
  await waitForModalAnimations(page);
  await page.screenshot({ path: path.join(session.screenshots, `g08-${label}-modal.png`) });
}

async function checkNoHorizontalScroll(page, label) {
  const [scrollWidth, innerWidth] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    window.innerWidth,
  ]);

  check(
    `G-08 ${label}: no horizontal scroll`,
    scrollWidth <= innerWidth,
    `scrollWidth=${scrollWidth} innerWidth=${innerWidth}`,
  );
}

// The touch-target utility grows the hit area with an absolute ::before, so the target is the larger of the two boxes.
async function checkTouchTarget(locator, label, name) {
  const size = await locator.first().evaluate((element) => {
    const box = element.getBoundingClientRect();
    const before = getComputedStyle(element, "::before");
    const hasHitArea = before.content !== "none" && before.position === "absolute";

    return {
      width: Math.max(box.width, hasHitArea ? Number.parseFloat(before.width) : 0),
      height: Math.max(box.height, hasHitArea ? Number.parseFloat(before.height) : 0),
    };
  });

  const ok = size.width >= MIN_TOUCH_TARGET_PX && size.height >= MIN_TOUCH_TARGET_PX;

  check(`G-08 ${label}: "${name}" is at least 44x44 px`, ok, `${Math.round(size.width)}x${Math.round(size.height)}`);
}

async function openGamePage(page, slug) {
  await page.goto(`${BASE_URL}/games/${slug}`, { waitUntil: "networkidle" });
}

// textContent, not innerText: the type-* utilities uppercase the text, and innerText returns the rendered case.
async function bodyText(page) {
  return (await page.locator("body").textContent()) ?? "";
}

async function screenshot(session, name) {
  await session.page.screenshot({ path: path.join(session.screenshots, `${name}.png`), fullPage: true });
}

async function waitUntil(timestamp) {
  const remaining = timestamp - Date.now();

  if (remaining > 0) {
    console.log(`Waiting ${Math.ceil(remaining / 1000)} s for itchOpensAt...`);
    await delay(remaining);
  }
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

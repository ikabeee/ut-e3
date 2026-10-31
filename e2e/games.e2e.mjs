// End-to-end check of the games catalog /games and the game page /games/[slug] in a real browser:
// npm run test:e2e:games
//
// Creates its own SQLite database in the system temp dir, seeds it, starts `next dev` on E2E_PORT and removes
// everything when it finishes. Flows G-01 to G-08 of odd/tasks/game-detail.md (S5) and G-09 to G-13 of
// odd/tasks/games-catalog.md (S8).
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
      catalog: readCatalog(database, featured.genreSlug),
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
      `SELECT g.id, g.slug, g.name, g.synopsis, ge.name AS genre, ge.slug AS genreSlug, s.zone, s.number,
              i.alt AS coverAlt
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

// The catalog lists every game in stand order, so the featured carousel opens on the first one.
function readCatalog(database, genreSlug) {
  const { count } = database.prepare("SELECT COUNT(*) AS count FROM games").get();

  const { genreCount } = database
    .prepare("SELECT COUNT(*) AS genreCount FROM games g JOIN genres ge ON ge.id = g.genre_id WHERE ge.slug = ?")
    .get(genreSlug);

  const first = database
    .prepare("SELECT g.name FROM games g JOIN stands s ON s.id = g.stand_id ORDER BY s.zone, s.number LIMIT 1")
    .get();

  return { count, genreCount, firstName: first.name };
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
    await checkNavbarToCatalog(session);
    await checkGenreFilter(session);
    await checkSearchEmptyState(session);
    await checkGenreTagToCatalog(session);
    await checkCatalogViewports(session);
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
  await screenshot(session, "01-itch-pending/01-game-page");
}

function cancunTime(date) {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Cancun",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

// G-01: tapping the game at the center of the landing coverflow opens its full page, with the navbar ("Inicio" only,
// S6); the featured game's page shows its data.
async function checkCatalogToGamePage(session) {
  const { page, fixture } = session;

  await followCoverflowCase(session, fixture.coverflowGame);
  await openGamePage(page, fixture.featured.slug);
  await checkGameData(page, fixture.featured);
  await screenshot(session, "02-coverflow-to-game/03-featured-game");
}

async function followCoverflowCase(session, game) {
  const { page } = session;
  const gamePath = `/games/${game.slug}`;

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  const caseLink = page.locator("#games").getByRole("link", { name: new RegExp(`^${escapeRegExp(game.name)},`) });
  await caseLink.scrollIntoViewIfNeeded();
  await page.screenshot({ path: screenshotPath(session, "02-coverflow-to-game/01-landing-coverflow") });

  check('G-01 no "Ver ficha" button', (await page.getByText("Ver ficha").count()) === 0);
  check("G-01 the center case links to its game", (await caseLink.getAttribute("href")) === gamePath, gamePath);

  await caseLink.click();
  await page.waitForURL((url) => url.pathname === gamePath, { timeout: 30_000 });
  await page.getByRole("heading", { level: 1, name: game.name }).waitFor({ timeout: 30_000 });
  check("G-01 the click opens the full game page", (await page.getByRole("dialog").count()) === 0, page.url());
  await checkNavbar(page);
  await screenshot(session, "02-coverflow-to-game/02-game-page");
}

async function checkNavbar(page) {
  const links = page.getByRole("navigation").getByRole("link");
  const labels = (await links.allTextContents()).map((label) => label.trim()).filter(Boolean);
  const inicio = page.getByRole("navigation").getByRole("link", { name: "Inicio", exact: true });

  check(
    "G-01 the navbar lists Inicio, Juegos and Patrocinadores",
    labels.join(",") === "Inicio,Juegos,Patrocinadores",
    labels.join(",") || "none",
  );
  check("G-01 Inicio goes to /", (await inicio.getAttribute("href")) === "/");
  check('G-01 no "Volver al catálogo" link', (await page.getByText("Volver al catálogo").count()) === 0);
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
  // The first match is the main column; the sidebar facts repeat the genre and the stand.
  const definition = page.locator("dl dt", { hasText: term }).first().locator("xpath=following-sibling::dd[1]");

  return (await definition.textContent())?.trim();
}

// G-02: the gallery opens on the cover in its main viewer, with one thumbnail tab per image (cover first, then by
// position); selecting a thumbnail shows its image in the viewer.
async function checkGallery(session) {
  const { page, fixture } = session;
  const viewer = page.getByRole("region", { name: "Galería" });
  const thumbnails = page.getByRole("tablist", { name: "Imágenes del juego" }).getByRole("tab");
  const count = await thumbnails.count();

  check("G-02 gallery has 5 images", count === 5, `count=${count}`);
  check("G-02 cover first", (await viewerAlt(viewer)) === fixture.featured.coverAlt, `"${await viewerAlt(viewer)}"`);
  check("G-02 cover thumbnail selected", (await thumbnails.first().getAttribute("aria-selected")) === "true");

  await viewer.scrollIntoViewIfNeeded();
  await screenshot(session, "03-gallery/01-game-page");

  await thumbnails.nth(2).click();
  const thirdAlt = await viewerAlt(viewer);
  check("G-02 clicking a thumbnail changes the main image", thirdAlt === fixture.featured.alts[2], `"${thirdAlt}"`);
  check("G-02 clicked thumbnail selected", (await thumbnails.nth(2).getAttribute("aria-selected")) === "true");
  await screenshot(session, "03-gallery/02-third-image");

  const alts = await viewerAltsByThumbnail(viewer, thumbnails, count);
  check("G-02 cover then by position", alts.join("|") === fixture.featured.alts.join("|"), alts.join(" | "));
  check(
    "G-02 every image has alt text",
    alts.every((alt) => alt.trim().length > 0),
  );
}

async function viewerAlt(viewer) {
  return viewer.locator("img").first().getAttribute("alt");
}

async function viewerAltsByThumbnail(viewer, thumbnails, count) {
  const alts = [];

  for (let index = 0; index < count; index += 1) {
    await thumbnails.nth(index).click();
    alts.push((await viewerAlt(viewer)) ?? "");
  }

  return alts;
}

// G-09: "Juegos" in the landing navbar opens /games, which starts with the featured carousel and lists every game.
async function checkNavbarToCatalog(session) {
  const { page, fixture } = session;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.getByRole("navigation").getByRole("link", { name: "Juegos", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/games", { timeout: 30_000 });
  await gameGrid(page).waitFor({ timeout: 30_000 });

  const featured = page.getByRole("region", { name: "Juegos del showcase" });
  const firstTitle = (await featured.getByRole("heading", { level: 2 }).textContent())?.trim();
  const cards = await gameCards(page).count();
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");

  check("G-09 navbar Juegos opens /games", page.url().endsWith("/games"), page.url());
  check("G-09 featured carousel opens on the first game", firstTitle === fixture.catalog.firstName, `"${firstTitle}"`);
  check("G-09 the grid lists every game", cards === fixture.catalog.count, `cards=${cards}`);
  check("G-09 canonical URL", Boolean(canonical?.endsWith("/games")), canonical ?? "none");
  await screenshot(session, "09-catalog/01-catalog");
}

// G-10: a genre tile filters the grid and writes ?genre=<slug>; a reload keeps it; pressing it again clears it.
async function checkGenreFilter(session) {
  const { page, fixture } = session;
  const { genre, genreSlug } = fixture.featured;
  const tile = page.getByRole("button", { name: new RegExp(`^${escapeRegExp(genre)}`) });

  await tile.click();
  await page.waitForURL((url) => url.searchParams.get("genre") === genreSlug, { timeout: 10_000 });
  check("G-10 the genre filters the grid", await hasCardCount(page, fixture.catalog.genreCount));
  await screenshot(session, "10-genre-filter/01-filtered");

  await page.reload({ waitUntil: "networkidle" });
  const pressed = await tile.getAttribute("aria-pressed");
  check(
    "G-10 a reload keeps the genre",
    pressed === "true" && (await gameCards(page).count()) === fixture.catalog.genreCount,
  );

  await tile.click();
  await page.waitForURL((url) => !url.searchParams.has("genre"), { timeout: 10_000 });
  check("G-10 pressing the genre again clears it", await hasCardCount(page, fixture.catalog.count));
}

// G-11: a search with no match shows the empty state, whose button brings every game back.
async function checkSearchEmptyState(session) {
  const { page, fixture } = session;

  await page.getByRole("searchbox", { name: "Buscar juegos" }).fill("zzz-sin-resultados");
  const empty = page.getByText("Ningún juego coincide con tu búsqueda.");
  check("G-11 no match shows the empty state", await empty.isVisible());
  await screenshot(session, "11-search-empty/01-empty");

  await page.getByRole("button", { name: "Ver todos los juegos" }).click();
  check("G-11 Ver todos los juegos restores the grid", (await gameCards(page).count()) === fixture.catalog.count);
}

// G-12: the genre tag of a game page opens the catalog filtered by that genre, and a card opens its game page.
async function checkGenreTagToCatalog(session) {
  const { page, fixture } = session;
  const { featured } = fixture;

  await openGamePage(page, featured.slug);
  await page.getByLabel("Etiquetas").getByRole("link", { name: featured.genre }).click();
  await page.waitForURL((url) => url.searchParams.get("genre") === featured.genreSlug, { timeout: 30_000 });
  await gameGrid(page).waitFor({ timeout: 30_000 });
  check(
    "G-12 the genre tag opens the filtered catalog",
    (await gameCards(page).count()) === fixture.catalog.genreCount,
  );

  await gameCards(page).filter({ hasText: featured.name }).click();
  await page.waitForURL((url) => url.pathname === `/games/${featured.slug}`, { timeout: 30_000 });
  check("G-12 a card opens its game page", page.url().endsWith(`/games/${featured.slug}`), page.url());
}

// G-13: the catalog has no horizontal scroll and keeps 44x44 px touch targets at every width.
async function checkCatalogViewports(session) {
  const { page } = session;

  for (const [index, viewport] of VIEWPORTS.entries()) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${BASE_URL}/games`, { waitUntil: "networkidle" });
    const label = `G-13 ${viewport.label}`;
    await checkNoHorizontalScroll(page, label);
    await checkTouchTarget(page.getByRole("navigation").getByRole("link", { name: "Juegos" }), label, "Juegos");
    await checkTouchTarget(page.getByRole("button", { name: "Juego siguiente" }), label, "Juego siguiente");
    await checkTouchTarget(page.getByRole("button", { name: "Más géneros" }), label, "Más géneros");
    await screenshot(session, `12-catalog-viewports/${String(index + 1).padStart(2, "0")}-${viewport.label}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
}

// replaceState changes the URL first; Next.js then syncs useSearchParams in a transition, so the grid updates a moment
// after waitForURL resolves.
async function hasCardCount(page, expected) {
  try {
    await page.waitForFunction(
      (count) => document.querySelectorAll('[aria-label="Todos los juegos"] > li').length === count,
      expected,
      { timeout: 10_000 },
    );

    return true;
  } catch {
    return false;
  }
}

function gameGrid(page) {
  return page.getByRole("list", { name: "Todos los juegos" });
}

function gameCards(page) {
  return gameGrid(page).getByRole("link");
}

// G-06: an unknown slug shows the not-found page with noindex. With Cache Components the first visit gets the App
// Shell before notFound() streams, so the status is 200 on that visit and 404 once cached (S4, L7 of game-detail).
async function checkUnknownSlug(session) {
  const { page } = session;
  const response = await page.goto(`${BASE_URL}/games/no-existe`, { waitUntil: "networkidle" });
  const status = response?.status();
  const robots = await page.locator('meta[name="robots"]').first().getAttribute("content");
  const notFoundText = await page.getByRole("heading", { level: 1, name: "Página no encontrada" }).count();
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  check("G-06 unknown slug answers 200 or 404", status === 200 || status === 404, `status=${status}`);
  check("G-06 not-found page is shown", notFoundText > 0, `matches=${notFoundText}`);
  check("G-06 not-found page has noindex", robots?.includes("noindex") === true, `robots=${robots}`);
  check("G-06 not-found page uses the black theme", background === "rgb(0, 0, 0)", background);
  await screenshot(session, "04-unknown-slug/01-not-found");
}

// G-07: the visitor sees the short stand code, never the full one.
async function checkShortCodeOnly(session) {
  const { page } = session;

  await openGamePage(page, FEATURED_SLUG);
  const match = (await bodyText(page)).match(FULL_STAND_CODE);
  check("G-07 no full stand code on the page", match === null, match?.[0] ?? "none");
  await screenshot(session, "05-short-code/01-game-page");
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
  await screenshot(session, "06-itch-open/01-game-page");
}

// G-05: a game without itch_url shows neither the pending text nor the link, even after itchOpensAt.
async function checkGameWithoutLink(session) {
  const { page, fixture } = session;

  await openGamePage(page, fixture.withoutLink.slug);
  const body = await bodyText(page);
  const links = await page.locator('a[href*="itch.io"]').count();

  check(`G-05 ${fixture.withoutLink.slug}: no pending text`, !body.includes("El enlace a itch.io se activa"));
  check(`G-05 ${fixture.withoutLink.slug}: no itch.io link`, links === 0, `count=${links}`);
  await screenshot(session, "07-game-without-link/01-game-page");
}

// G-08: no horizontal scroll and 44x44 px touch targets at phone, landscape and desktop widths.
async function checkViewports(session) {
  const { page } = session;

  for (const [index, viewport] of VIEWPORTS.entries()) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openGamePage(page, FEATURED_SLUG);
    const label = `G-08 ${viewport.label}`;
    await checkNoHorizontalScroll(page, label);
    await checkTouchTarget(
      page.getByRole("navigation").getByRole("link", { name: "Inicio", exact: true }),
      label,
      "Inicio",
    );
    await checkTouchTarget(page.getByRole("link", { name: "Jugar en itch.io" }), label, "Jugar en itch.io");
    await screenshot(session, `08-viewports/${String(index + 1).padStart(2, "0")}-${viewport.label}`);
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

  check(`${label}: "${name}" is at least 44x44 px`, ok, `${Math.round(size.width)}x${Math.round(size.height)}`);
}

async function openGamePage(page, slug) {
  await page.goto(`${BASE_URL}/games/${slug}`, { waitUntil: "networkidle" });
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

// One numbered folder per flow, in the order the run visits them: 01-itch-pending/01-game-page.png, ...
function screenshotPath(session, name) {
  const file = path.join(session.screenshots, `${name}.png`);

  mkdirSync(path.dirname(file), { recursive: true });

  return file;
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

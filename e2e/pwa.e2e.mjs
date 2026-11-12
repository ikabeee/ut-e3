// End-to-end check of the PWA with real browsers: npm run test:e2e:pwa
//
// A visitor registers on a phone, the service worker takes control and saves the public pages, and the phone goes
// offline: the passport still shows the PIN with the notice "Sin conexion. Datos de hace X", and the landing, the
// catalog and a game still open. Then the network returns and the page retries by itself. The staff areas are never
// stored, and when the help desk replaces the device of the passport the old phone deletes its copy.
// Service workers only run in production, so this builds the app (next build) and serves it with next start on
// localhost, with its own SQLite database in the system temp dir (db:seed, db:seed:stands and db:seed:support).
// It removes everything when it finishes. The checks read the database to confirm what was recorded.
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

const PORT = Number(process.env.E2E_PORT ?? 3464);

const BASE_URL = `http://localhost:${PORT}`;

const HELP_DESK = { email: "help-desk@ejemplo.com", password: "support-dev-password" };

const FULL_NAME = "E2E Neo";

const GAMERTAG = "e2e_neo";

const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const PRIVATE_PATHS = /\/(admin|stand|support|tournament|api|login|activate|passport|register)(\/|\?|$)/;

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
  const workdir = mkdtempSync(path.join(tmpdir(), "ut-e3-e2e-pwa-"));
  const screenshots = process.env.E2E_SCREENSHOTS_DIR ?? path.join(ROOT, "e2e", "screenshots");
  mkdirSync(screenshots, { recursive: true });

  const env = buildEnvironment(workdir);
  const databaseFile = path.join(workdir, "e2e.db");
  prepareApp(env);

  const server = startServer(env, path.join(workdir, "server.log"));
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
    NODE_ENV: "production",
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
    STAND_DEV_PASSWORD: "stand-dev-password",
    SUPPORT_DEV_PASSWORD: HELP_DESK.password,
  };
}

// The seeds of the demo refuse to run in production, so they run in development mode; the build and the server run in
// production because the service worker is only registered there. db:seed:stands also opens the registration.
function prepareApp(env) {
  const seedEnv = { ...env, NODE_ENV: "development" };

  runNpmScript("db:deploy", seedEnv);
  runNpmScript("db:seed", seedEnv);
  runNpmScript("db:seed:stands", seedEnv);
  runNpmScript("db:seed:support", seedEnv);

  const build = spawnSync(process.execPath, [NEXT_CLI, "build"], { env, stdio: "inherit", cwd: ROOT });

  if (build.status !== 0) {
    throw new Error(`next build failed with exit code ${build.status}`);
  }
}

// npm sets npm_execpath when it runs this script (`npm run test:e2e:pwa`), so the same npm CLI runs the seeds.
function runNpmScript(name, env) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, "run", name], { env, stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`npm run ${name} failed with exit code ${result.status}`);
  }
}

function startServer(env, logFile) {
  const log = openSync(logFile, "w");

  return spawn(process.execPath, [NEXT_CLI, "start", "-p", String(PORT)], { env, stdio: ["ignore", log, log] });
}

// `next start` may start child processes that keep the database open; on Windows only the whole tree releases it.
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
      const response = await fetch(`${BASE_URL}/offline`, { redirect: "manual" });

      if (response.status < 500) {
        return;
      }
    } catch {
      // The server is still starting; retry until the deadline.
    }

    await delay(1000);
  }

  throw new Error(`next start did not answer on ${BASE_URL} within ${SERVER_READY_TIMEOUT_MS} ms`);
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
  const phone = await openPage({ browser, errors: consoleErrors });
  const desk = await openPage({ browser, errors: consoleErrors });

  try {
    await checkManifest(phone.page);
    const pin = await registerVisitor(phone.page);

    await checkWorkerAndSnapshot({ page: phone.page, pin });
    await checkPublicPagesAreSaved({ page: phone.page, database });
    await checkVenueMapOnline(phone.page);
    await checkIosSteps({ browser, context: phone.context });
    await checkOffline({ phone, database, screenshots, pin });
    await checkNothingSavedWithoutCopy(browser);
    await checkReconnectRetries({ phone, pin });
    await checkReloadedOfflinePageLeavesWithNetwork({ phone, pin });
    await checkStaffIsNeverStored(desk);
    await checkDeviceReplacement({ phone, desk, browser });
  } finally {
    check("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");

    await phone.context.close();
    await desk.context.close();
    database.close();
  }
}

async function openPage({ browser, errors, options = {} }) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...options });
  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() === "error" && !isOfflineNoise(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  return { context, page };
}

// While the phone is offline the browser logs every request that could not leave (images, background refreshes).
function isOfflineNoise(text) {
  return /Failed to load resource: net::ERR_(FAILED|INTERNET_DISCONNECTED)/.test(text);
}

async function checkManifest(page) {
  const response = await page.request.get(`${BASE_URL}/manifest.webmanifest`);
  const manifest = await response.json();

  check("the manifest is served", response.ok(), String(response.status()));
  check(
    "it opens on the passport as a standalone app in Spanish",
    manifest.start_url === "/passport" && manifest.display === "standalone" && manifest.lang === "es",
    `${manifest.start_url} ${manifest.display} ${manifest.lang}`,
  );
  check("it is named after the event", manifest.name === "PIXEL & CODE" && manifest.short_name === "PIXEL & CODE");
  check("it has the icons of 192 and 512 px and a maskable one", hasInstallIcons(manifest.icons ?? []));

  for (const icon of manifest.icons ?? []) {
    const iconResponse = await page.request.get(`${BASE_URL}${icon.src}`);

    check(
      `the icon ${icon.src} is served as an image`,
      iconResponse.headers()["content-type"]?.startsWith("image/png"),
    );
  }

  const worker = await page.request.get(`${BASE_URL}/sw.js`);

  check(
    "the worker is never cached by the browser and may control the whole site",
    worker.headers()["cache-control"]?.includes("no-cache") && worker.headers()["service-worker-allowed"] === "/",
    worker.headers()["cache-control"],
  );
}

function hasInstallIcons(icons) {
  const sizes = icons.map((icon) => `${icon.sizes} ${icon.purpose}`);

  return ["192x192 any", "512x512 any", "512x512 maskable"].every((expected) => sizes.includes(expected));
}

async function registerVisitor(page) {
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Nombre completo").fill(FULL_NAME);
  await page.getByLabel("Gamertag").fill(GAMERTAG);
  await page.getByLabel("Correo electrónico").fill("e2e-neo@example.test");
  await page.getByRole("button", { name: "Registrar pasaporte" }).click();
  await page.waitForURL(/\/passport$/, { timeout: 30_000 });

  const pin = (await page.locator("p.type-mono").first().textContent()).trim();

  check("the visitor registers and gets a five-digit PIN", /^\d{5}$/.test(pin), pin);

  return pin;
}

async function checkWorkerAndSnapshot({ page, pin }) {
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);

  check("the service worker registers from the visitor flow and becomes ready", scope === `${BASE_URL}/`, scope);

  await page.reload({ waitUntil: "networkidle" });

  const isControlled = await page.evaluate(() => navigator.serviceWorker.controller !== null);
  const saved = await page.evaluate(() => window.localStorage.getItem("ute3.passport.v1"));

  check("the worker controls the page after it loads", isControlled);
  check("the phone saved the passport (PIN included) after the load", saved?.includes(pin) === true);
  check("the passport shows the connection state", await page.getByText("En línea", { exact: true }).isVisible());
}

async function checkPublicPagesAreSaved({ page, database }) {
  const slugs = database
    .prepare("SELECT slug FROM games ORDER BY slug")
    .all()
    .map((row) => row.slug);

  const expected = ["/", "/games", "/offline", ...slugs.map((slug) => `/games/${slug}`)];
  let saved = [];

  for (let attempt = 0; attempt < 60; attempt += 1) {
    saved = await listCachedPaths(page);

    if (expected.every((item) => saved.includes(item))) break;

    await delay(500);
  }

  const missing = expected.filter((item) => !saved.includes(item));

  await checkItchLinkStaysOnTheServer({ page, database, slug: slugs[0] });
  check(
    `the catalog, the floor plan and all ${slugs.length} games are saved ahead of time`,
    missing.length === 0,
    missing.join(", "),
  );
}

// RF-10: before the activation time the page, its copy in the cache and the API answer carry no itch.io URL.
async function checkItchLinkStaysOnTheServer({ page, database, slug }) {
  const url = "https://e2e.itch.io/secret-game";

  database.prepare("UPDATE games SET itch_url = ? WHERE slug = ?").run(url, slug);

  const html = await (await page.request.get(`${BASE_URL}/games/${slug}`)).text();
  const response = await page.request.get(`${BASE_URL}/api/games/${slug}/itch`);
  const body = await response.json();

  check("the game page does not carry the itch.io URL before the activation time", !html.includes(url));
  check(
    "the itch.io API answers with the server clock and no URL yet, never stored",
    body.link?.status === "pending" &&
      !JSON.stringify(body).includes(url) &&
      response.headers()["cache-control"] === "no-store",
    JSON.stringify(body),
  );
  check(
    "the itch.io API is not in the caches of the worker",
    !(await listCachedPaths(page)).some((item) => item.startsWith("/api/")),
  );
}

// The paths of every page of the worker caches, without the host.
async function listCachedPaths(page) {
  return page.evaluate(async () => {
    const paths = [];

    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) paths.push(new URL(request.url).pathname);
    }

    return paths;
  });
}

const VENUE_MAP_REGION = "[role=region][aria-label^='Mapa de la ubicación']";

// RF-07 and the venue map: it draws the Mapbox tiles online (the build needs NEXT_PUBLIC_MAPBOX_TOKEN, from the
// environment or .env), the worker never stores them (another origin), and the schematic stays underneath as the fallback.
async function checkVenueMapOnline(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.locator("#venue").scrollIntoViewIfNeeded();

  const region = page.locator(VENUE_MAP_REGION);

  await page.waitForSelector(".venue-map img.leaflet-tile-loaded", { timeout: UI_TIMEOUT_MS });
  check("online, the venue map shows tiles", (await region.getAttribute("aria-hidden")) === "false");
  const credit = await page.locator(".leaflet-control-attribution").innerText();

  check(
    "the venue map names Edificio B and credits Mapbox and OpenStreetMap",
    (await region.getAttribute("aria-label")).includes("Edificio B") &&
      ["© Mapbox", "© OpenStreetMap", "Improve this map"].every((text) => credit.includes(text)),
  );
  check(
    "the venue map shows the Mapbox logo linked to mapbox.com",
    (await page.locator(".venue-map__logo").getAttribute("href")) === "https://www.mapbox.com/",
  );

  const origins = await page.evaluate(async () => {
    const found = new Set();

    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) found.add(new URL(request.url).origin);
    }

    return [...found];
  });

  check(
    "the worker never stores the map tiles of another origin",
    origins.every((origin) => origin === BASE_URL),
    origins.join(", "),
  );
}

async function checkIosSteps({ browser, context }) {
  const errors = [];
  const iphone = await openPage({ browser, errors, options: { userAgent: SAFARI_IPHONE } });

  await iphone.context.addCookies(await context.cookies());
  await iphone.page.goto(`${BASE_URL}/passport`, { waitUntil: "networkidle" });

  const hasSteps = await iphone.page.getByText("Toca Compartir y elige Añadir a pantalla de inicio.").isVisible();

  check("Safari on iPhone gets the steps Compartir, Añadir a pantalla de inicio", hasSteps);
  await iphone.context.close();
}

async function checkOffline({ phone, database, screenshots, pin }) {
  const { page, context } = phone;

  await context.setOffline(true);
  await page.goto(`${BASE_URL}/passport`, { waitUntil: "domcontentloaded" });
  await page.getByText(/Sin conexión\. Datos de hace/).waitFor({ timeout: UI_TIMEOUT_MS });

  check("offline, /passport shows the saved copy with the notice Sin conexion. Datos de hace X", true, page.url());
  check("the saved PIN is on the screen", (await page.locator("body").innerText()).includes(pin));
  check(
    "the page says there is no connection",
    await page.getByText("Sin conexión", { exact: true }).first().isVisible(),
  );
  check("the page offers a Reintentar button", await page.getByRole("button", { name: "Reintentar" }).isVisible());
  await page.screenshot({ path: path.join(screenshots, "pwa-offline-passport.png"), fullPage: true });

  await checkOfflinePublicPages({ page, database });
}

async function checkOfflinePublicPages({ page, database }) {
  const game = database.prepare("SELECT slug, name FROM games ORDER BY slug LIMIT 1").get();

  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  check("offline, the landing opens", await page.getByRole("heading", { level: 1, name: "PIXEL & CODE" }).isVisible());
  await page.locator("#venue").scrollIntoViewIfNeeded();
  await page.waitForSelector(`${VENUE_MAP_REGION}[aria-hidden=true]`, { state: "attached", timeout: UI_TIMEOUT_MS });
  check(
    "offline, the venue map gives way to the schematic",
    await page.getByRole("img", { name: /entre el centro y el aeropuerto/ }).isVisible(),
  );
  check(
    "offline, the landing still shows the floor plan",
    await page.locator("#floor-plan, #croquis").first().isVisible(),
  );

  await page.goto(`${BASE_URL}/games`, { waitUntil: "domcontentloaded" });
  check(
    "offline, the catalog opens",
    await page.getByRole("heading", { level: 1, name: "Catálogo de juegos" }).isVisible(),
  );

  await page.goto(`${BASE_URL}/games/${game.slug}`, { waitUntil: "domcontentloaded" });
  check(
    `offline, the game ${game.name} opens`,
    await page.getByRole("heading", { name: game.name }).first().isVisible(),
  );
}

// A phone that never saved anything has no copy of the passport: /offline says so and never invents a PIN.
async function checkNothingSavedWithoutCopy(browser) {
  const errors = [];
  const stranger = await openPage({ browser, errors });

  await stranger.page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await stranger.page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  await stranger.context.setOffline(true);
  await stranger.page.goto(`${BASE_URL}/games/a-game-that-was-never-saved`, { waitUntil: "domcontentloaded" });
  await stranger.page.getByText("Aún no hay una copia guardada").waitFor({ timeout: UI_TIMEOUT_MS });

  const body = await stranger.page.locator("body").innerText();

  check(
    "without a saved page, /offline explains it instead of an error",
    /offline/.test(stranger.page.url()),
    stranger.page.url(),
  );
  check("and a phone without a copy never shows a PIN", !/\b\d{5}\b/.test(body));
  await stranger.context.close();
}

async function checkReconnectRetries({ phone, pin }) {
  const { page, context } = phone;

  // Still offline, the visitor opens the passport again: it lands on /offline, which waits for the network.
  await page.goto(`${BASE_URL}/passport`, { waitUntil: "domcontentloaded" });
  await page.getByText(/Sin conexión\. Datos de hace/).waitFor({ timeout: UI_TIMEOUT_MS });
  await context.setOffline(false);
  await page.waitForURL(/\/passport$/, { timeout: UI_TIMEOUT_MS });
  await page.getByText("En línea", { exact: true }).waitFor({ timeout: UI_TIMEOUT_MS });
  check("when the network returns, the page retries by itself and shows the live passport", true, page.url());
  check("with the same PIN", (await page.locator("body").innerText()).includes(pin));
}

// The worker serves /offline from its cache, so a reload with a network never sees an offline -> online change: the
// page has to ask the server by itself and leave.
async function checkReloadedOfflinePageLeavesWithNetwork({ phone, pin }) {
  const { page } = phone;

  await page.goto(`${BASE_URL}/offline`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(/\/passport$/, { timeout: UI_TIMEOUT_MS });
  check("reloading /offline with a network ends at /passport", page.url().endsWith("/passport"), page.url());
  await page.getByText("En línea", { exact: true }).waitFor({ timeout: UI_TIMEOUT_MS });
  check("with the same PIN", (await page.locator("body").innerText()).includes(pin));
}

async function checkStaffIsNeverStored(desk) {
  const { page, context } = desk;

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  await signIn(page, HELP_DESK);
  await page.waitForURL(/\/support\/recovery$/, { timeout: UI_TIMEOUT_MS });
  await page.goto(`${BASE_URL}/support/recovery`, { waitUntil: "networkidle" });

  const cached = await listCachedPaths(page);
  const leaked = cached.filter((cachedPath) => PRIVATE_PATHS.test(cachedPath) && !cachedPath.startsWith("/_next/"));

  check("the help desk session left nothing of the staff areas in the caches", leaked.length === 0, leaked.join(", "));

  await context.setOffline(true);

  const reachedOffline = await page.goto(`${BASE_URL}/support/recovery`).then(
    () => true,
    () => false,
  );

  check("offline, a staff page is not answered from any copy", !reachedOffline);
  await context.setOffline(false);
}

async function checkDeviceReplacement({ phone, desk, browser }) {
  await recoverPassport(desk.page);

  const link = await desk.page.getByLabel("Enlace de acceso").inputValue();
  const errors = [];
  const newPhone = await openPage({ browser, errors });

  await newPhone.page.goto(link, { waitUntil: "networkidle" });
  await newPhone.page.waitForURL(/\/passport$/, { timeout: UI_TIMEOUT_MS });
  check("the recovery link makes the new phone the active device", true, newPhone.page.url());

  const before = await phone.page.evaluate(() => window.localStorage.getItem("ute3.passport.v1"));

  await phone.page.goto(`${BASE_URL}/passport`, { waitUntil: "networkidle" });
  await phone.page.waitForURL(/\/register$/, { timeout: UI_TIMEOUT_MS });

  const after = await phone.page.evaluate(() => window.localStorage.getItem("ute3.passport.v1"));

  check("the old phone had a copy of the passport", before !== null);
  check("once the old phone is online again, its copy of the passport is deleted", after === null);
  await newPhone.context.close();
}

async function recoverPassport(page) {
  await page.goto(`${BASE_URL}/support/recovery`, { waitUntil: "networkidle" });
  await page.getByLabel("Correo, gamertag o nombre completo").fill(GAMERTAG);
  await page.getByRole("button", { name: "Buscar pasaporte" }).click();
  await page.getByRole("button", { name: "Recuperar este pasaporte" }).click();
  await page.getByRole("heading", { name: "Pasaporte recuperado" }).waitFor({ timeout: UI_TIMEOUT_MS });
}

async function signIn(page, { email, password }) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
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

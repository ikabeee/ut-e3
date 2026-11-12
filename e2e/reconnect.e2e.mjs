// End-to-end check of /offline when the network comes back, in a real browser: npm run test:e2e:reconnect
//
// When a page cannot load, the service worker sends the visitor to /offline?from=<page>; as soon as the network
// returns, /offline has to leave for that page (not always for the passport): offline -> /offline -> online. Also:
// the button "Reintentar", a network without the server, a visit that already has a network and a "from" that points
// outside the site. The service worker itself (and the passport version of this check) lives in e2e/pwa.e2e.mjs; here
// it is blocked so the page under test is /offline alone and the script runs on `next dev` with a temporary database.
import { runE2e, UI_TIMEOUT_MS } from "./lib/e2e-harness.mjs";

const PORT = Number(process.env.E2E_PORT ?? 3466);

const ORIGIN_PAGE = "/sponsors";

main().then(
  (exitCode) => {
    process.exitCode = exitCode;
  },
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);

function main() {
  return runE2e({ name: "reconnect", port: PORT, scenario: runScenario });
}

async function runScenario({ browser, baseUrl, check }) {
  const consoleErrors = [];
  const context = await browser.newContext({ viewport: { width: 360, height: 740 }, serviceWorkers: "block" });
  const page = await context.newPage();
  const session = { page, context, baseUrl, check };

  page.on("console", (message) => {
    if (message.type() === "error" && !isExpectedNetworkError(message.text())) consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  try {
    await checkOfflineThenOnline(session);
    await checkRetryButton(session);
    await checkVisitWithNetwork(session);
    await checkForeignOriginIsIgnored(session);
  } finally {
    check("no browser console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");
    await context.close();
  }
}

// Going offline and blocking the server on purpose makes the browser log the failed requests.
function isExpectedNetworkError(text) {
  return /Failed to load resource|net::ERR|Failed to fetch/.test(text);
}

async function checkOfflineThenOnline(session) {
  const { page, check } = session;

  await openOfflinePage(session);
  check("with a network but no server, /offline says so instead of Sin conexión", true);
  await goOffline(session);
  check("offline, /offline says Sin conexión and stays", page.url().includes("/offline"), page.url());

  const origin = await comeBack(session);

  await page.waitForURL(origin, { timeout: UI_TIMEOUT_MS });
  check("when the network returns, /offline leaves for the page the visitor wanted", true, page.url());
  check("and it is not the passport", !page.url().endsWith("/passport"));
}

async function checkRetryButton(session) {
  const { page, check } = session;

  await openOfflinePage(session);
  await goOffline(session);
  await page.getByRole("button", { name: "Reintentar" }).click();
  check("tapping Reintentar without a network stays on /offline", page.url().includes("/offline"), page.url());

  const origin = await comeBack(session);

  await page.getByRole("button", { name: "Reintentar" }).click();
  await page.waitForURL(origin, { timeout: UI_TIMEOUT_MS });
  check("with the network back, Reintentar leaves for the same page", true, page.url());
}

// A visit that already has a network never sees an offline -> online change: the page has to ask by itself.
async function checkVisitWithNetwork({ page, baseUrl, check }) {
  await page.goto(`${baseUrl}/offline?from=${encodeURIComponent(ORIGIN_PAGE)}`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(`${baseUrl}${ORIGIN_PAGE}`, { timeout: UI_TIMEOUT_MS });
  check("opening /offline with a network leaves for the page by itself", true, page.url());
}

// ?from= only accepts paths of this site: another origin falls back to the passport and never leaves the site.
async function checkForeignOriginIsIgnored({ page, baseUrl, check }) {
  await page.goto(`${baseUrl}/offline?from=${encodeURIComponent("//evil.example/steal")}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForURL((url) => url.pathname !== "/offline", { timeout: UI_TIMEOUT_MS });
  check("a from= that points to another site is ignored", new URL(page.url()).origin === baseUrl, page.url());
}

// The page the visitor wanted does not answer yet, so /offline waits for it.
async function openOfflinePage({ page, baseUrl }) {
  await page.route(`**${ORIGIN_PAGE}`, (route) => route.abort("connectionrefused"));
  await page.goto(`${baseUrl}/offline?from=${encodeURIComponent(ORIGIN_PAGE)}`, { waitUntil: "domcontentloaded" });
  await page.getByText("Tenemos red pero no llegamos al servidor").waitFor({ timeout: UI_TIMEOUT_MS });
}

async function goOffline({ page, context }) {
  await context.setOffline(true);
  await page.getByRole("heading", { name: "Sin conexión" }).waitFor({ timeout: UI_TIMEOUT_MS });
}

async function comeBack({ page, context, baseUrl }) {
  await page.unroute(`**${ORIGIN_PAGE}`);
  await context.setOffline(false);

  return `${baseUrl}${ORIGIN_PAGE}`;
}

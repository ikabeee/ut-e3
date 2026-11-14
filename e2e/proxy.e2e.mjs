// End-to-end check of the public origin behind a proxy or a tunnel: npm run test:e2e:proxy
//
// The server listens on localhost but the site lives at another address (NEXT_PUBLIC_SITE_URL), as behind a reverse
// proxy or a tunnel. Whatever Host the request arrives with, the redirects (login, the claim links) and the links in
// the emails must use the public origin, never the internal one. Raw HTTP requests set the Host header, which a
// browser does not allow; one browser flow asks for the recovery email and follows its link.
import http from "node:http";
import { delay, runE2e, storedDate, UI_TIMEOUT_MS } from "./lib/e2e-harness.mjs";

const PORT = Number(process.env.E2E_PORT ?? 3468);

const PUBLIC_ORIGIN = "https://public.example.test";

const INTERNAL_HOSTS = ["internal.example.test:9999", "127.0.0.1:1", `localhost:${PORT}`];

const EMAIL = "e2e-proxy@example.test";

const RECOVERY_SUBJECT = "Recupera tu pasaporte";

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
  return runE2e({ name: "proxy", port: PORT, siteUrl: PUBLIC_ORIGIN, scenario: runScenario });
}

async function runScenario({ browser, baseUrl, database, check }) {
  const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const page = await context.newPage();

  try {
    await checkSessionRedirects(check);
    await checkExpiredClaimRedirects(check);
    await registerVisitor({ page, baseUrl, database });

    const link = await requestRecoveryEmail({ page, baseUrl, database, check });

    await checkRecoveryLinkRedirects({ link, check });
  } finally {
    await context.close();
  }
}

// The proxy of the app sends a staff area without a session to /login.
async function checkSessionRedirects(check) {
  for (const host of INTERNAL_HOSTS) {
    const response = await request({ path: "/admin", host });

    check(
      `/admin without a session goes to the public /login (Host ${host})`,
      response.location === `${PUBLIC_ORIGIN}/login`,
      `${response.status} ${response.location}`,
    );
  }

  const forwarded = await request({
    path: "/support/recovery",
    host: "internal.example.test",
    forwardedHost: "x.test",
  });

  check("and X-Forwarded-Host does not change it", forwarded.location === `${PUBLIC_ORIGIN}/login`, forwarded.location);
}

async function checkExpiredClaimRedirects(check) {
  for (const host of INTERNAL_HOSTS) {
    const response = await request({ path: "/passport/claim/not-a-real-token", host });

    check(
      `a claim link that no longer works goes to the public expired page (Host ${host})`,
      response.location === `${PUBLIC_ORIGIN}/passport/recover/expired`,
      `${response.status} ${response.location}`,
    );
    check("and sets no cookie", response.cookie === undefined);
  }
}

async function registerVisitor({ page, baseUrl, database }) {
  const opened = storedDate(database, "registration_opens_at", Date.now() - 86_400_000);

  database.prepare("UPDATE event_settings SET registration_opens_at = ?").run(opened);
  await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Nombre completo").fill("E2E Proxy");
  await page.getByLabel("Gamertag").fill("e2e_proxy");
  await page.getByLabel("Correo electrónico").fill(EMAIL);
  await page.getByRole("button", { name: "Registrar pasaporte" }).click();
  await page.waitForURL(/\/passport$/, { timeout: 30_000 });
}

// The email is queued after the answer, so the row is awaited; its link must carry the public origin.
async function requestRecoveryEmail({ page, baseUrl, database, check }) {
  await page.context().clearCookies();
  await page.goto(`${baseUrl}/passport/recover`, { waitUntil: "networkidle" });
  await page.getByLabel("Correo electrónico").fill(EMAIL);
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await page.getByRole("status").waitFor({ timeout: UI_TIMEOUT_MS });

  const text = await waitForEmailText(database);
  const links = text.match(/https?:\/\/\S+/g) ?? [];

  check("the recovery email carries one link", links.length === 1, links.join(" "));
  check("whose origin is the public one", links[0]?.startsWith(`${PUBLIC_ORIGIN}/passport/claim/`), links[0]);
  check("and never the internal address", !/localhost|127\.0\.0\.1|internal\.example/.test(text));

  return links[0];
}

async function waitForEmailText(database) {
  const deadline = Date.now() + UI_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const row = database
      .prepare("SELECT text FROM email_outbox WHERE to_address = ? AND subject = ?")
      .get(EMAIL, RECOVERY_SUBJECT);

    if (row) return row.text;

    await delay(250);
  }

  throw new Error("The recovery email did not reach email_outbox");
}

// Opening the link on the internal server (the link itself points to the public one) must stay on the public origin.
async function checkRecoveryLinkRedirects({ link, check }) {
  const { pathname } = new URL(link);

  for (const host of INTERNAL_HOSTS) {
    const response = await request({ path: pathname, host });

    check(
      `a valid email link goes to the public confirmation page (Host ${host})`,
      response.location?.startsWith(`${PUBLIC_ORIGIN}/passport/recover/confirm#`),
      `${response.status} ${response.location}`,
    );

    // The link is not spent by a GET (mail scanners follow links), so the same link works for every host.
    check("and a GET does not spend it", response.status >= 300 && response.status < 400);
  }
}

function request({ path, host, forwardedHost }) {
  const headers = { host };

  if (forwardedHost) headers["x-forwarded-host"] = forwardedHost;

  return new Promise((resolve, reject) => {
    const options = { host: "127.0.0.1", port: PORT, path, method: "GET", headers };

    const req = http.request(options, (response) => {
      response.resume();
      resolve({
        status: response.statusCode,
        location: response.headers.location,
        cookie: response.headers["set-cookie"],
      });
    });

    req.on("error", reject);
    req.end();
  });
}

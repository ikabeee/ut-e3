// End-to-end walkthrough of the demo with real browsers: npm run test:e2e:demo
//
// Seeds a clean temporary database with `db:seed` and `db:seed:demo` (one shared password for every account, no hour
// of the event moved) and follows the script of a demonstration: every role signs in and lands on its own home, a
// visitor registers, checks in at a stand and rates it, the sysadmin finds the visit in the moderation alert ("Ver
// visitantes"), the help desk finds the passport by email, gamertag and name and recovers it, registers a walk-in
// visitor and the sysadmin reactivates a disabled account. The hours are moved in the temporary database only,
// because the demo seed leaves them where the schedule of the event has them.
import { count, runE2e, signIn, storedDate, UI_TIMEOUT_MS } from "./lib/e2e-harness.mjs";

const PORT = Number(process.env.E2E_PORT ?? 3467);

const DEMO_PASSWORD = "demo-e2e-password-1";

const SYSADMIN = { email: "sysadmin@example.test", password: "E2e-Sysadmin-2026!" };

const ROLES = [
  { name: "stand staff", email: "staff-za-s1@ejemplo.com", home: "/stand/kiosk" },
  { name: "stand admin", email: "stand-admin@ejemplo.com", home: "/stand/kiosk" },
  { name: "KOF admin", email: "kof-admin@ejemplo.com", home: "/admin/kof" },
  { name: "KOF staff", email: "kof-mesa1@ejemplo.com", home: "/admin/kof" },
  { name: "help desk", email: "help-desk@ejemplo.com", home: "/support/recovery" },
  { name: "raffle host", email: "rifa-1@ejemplo.com", home: "/admin/raffle" },
];

const VISITOR = { fullName: "Demo Visitante", gamertag: "demo_visitor", email: "demo-visitor@example.test" };

const SUBMIT = "Enviar y registrar mi visita";

const HOUR = 3_600_000;

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
  return runE2e({
    name: "demo",
    port: PORT,
    seeds: ["db:seed:demo"],
    env: { DEMO_PASSWORD },
    scenario: runScenario,
  });
}

async function runScenario({ browser, baseUrl, database, check }) {
  const errors = [];
  const session = { browser, baseUrl, database, check, errors };

  try {
    await checkEveryRoleLandsOnItsHome(session);
    openTheEventHours(database);

    const pin = await registerVisitor(session);

    await checkInAndRateAtTheStand(session, pin);
    await checkModerationShowsTheVisitor(session);
    await checkDeskFindsAndRecoversThePassport(session);
    await checkDeskRegistersAWalkIn(session);
    await checkReactivation(session);
  } finally {
    check("no browser console errors", errors.length === 0, errors.slice(0, 5).join(" | ") || "none");
  }
}

async function checkEveryRoleLandsOnItsHome(session) {
  const everyone = [...ROLES, { name: "sysadmin", ...SYSADMIN, home: "/admin" }];

  for (const role of everyone) {
    const password = role.password ?? DEMO_PASSWORD;
    const { context, page } = await signInAs(session, { email: role.email, password }, role.home);

    session.check(`the ${role.name} signs in with the demo password and lands on ${role.home}`, true, page.url());
    await context.close();
  }
}

// The demo seed does not move any hour, so the temporary database opens the registration and the check-ins by hand.
function openTheEventHours(database) {
  const now = Date.now();

  const dates = {
    registration_opens_at: now - 24 * HOUR,
    event_starts_at: now - 2 * HOUR,
    check_in_cutoff_at: now + 2 * HOUR,
    raffle_starts_at: now + 3 * HOUR,
  };

  for (const [column, milliseconds] of Object.entries(dates)) {
    database
      .prepare(`UPDATE event_settings SET ${column} = ? WHERE id = 1`)
      .run(storedDate(database, "registration_opens_at", milliseconds));
  }

  // One perfect rating is enough for a burst alert, so the moderation step has something to show.
  database.prepare("UPDATE event_settings SET fraud_top_score_count = 1").run();
}

async function registerVisitor({ browser, baseUrl, errors, check }) {
  const { context, page } = await openPage({ browser, errors }, { width: 360, height: 740 });

  await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle" });
  await page.getByLabel("Nombre completo").fill(VISITOR.fullName);
  await page.getByLabel("Gamertag").fill(VISITOR.gamertag);
  await page.getByLabel("Correo electrónico").fill(VISITOR.email);
  await page.getByRole("button", { name: "Registrar pasaporte" }).click();
  await page.waitForURL(/\/passport$/, { timeout: 30_000 });

  const pin = (await page.locator("p.type-mono").first().textContent()).trim();

  check("a visitor registers and gets a five-digit PIN", /^\d{5}$/.test(pin), pin);
  await context.close();

  return pin;
}

async function checkInAndRateAtTheStand(session, pin) {
  const { context, page } = await signInAs(session, { email: ROLES[0].email, password: DEMO_PASSWORD }, "/stand/kiosk");

  await page.getByLabel("PIN de 5 dígitos").fill(pin);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Calificar en esta pantalla" }).click();

  for (const question of ["El juego", "El stand", "El arte"]) {
    await page.getByRole("group", { name: question }).locator("label").filter({ hasText: /^5$/ }).click();
  }

  await page.getByRole("button", { name: SUBMIT }).click();
  await page.getByRole("heading", { name: "¡Gracias!" }).waitFor({ timeout: UI_TIMEOUT_MS });
  session.check(
    "the visit at the stand is rated and recorded",
    count(session.database, "checkins", "scanned_by_id IS NOT NULL") === 1,
  );
  await context.close();
}

// With the threshold of the alert at 1 (changed in the temporary database), one perfect rating is a burst.
async function checkModerationShowsTheVisitor(session) {
  const { context, page } = await signInAs(session, SYSADMIN, "/admin");

  await page.goto(`${session.baseUrl}/admin/moderation`, { waitUntil: "networkidle" });

  const bursts = page.getByTestId("fraud-bursts");

  await bursts.getByText(/ZA-S1-.*: 1 calificaciones de 5/).waitFor({ timeout: UI_TIMEOUT_MS });
  await bursts.getByText("Ver visitantes (1)").click();

  const visit = bursts.getByTestId("selectable-visit");

  await visit.first().waitFor({ timeout: UI_TIMEOUT_MS });

  const text = await visit.first().innerText();

  session.check("'Ver visitantes' shows who rated: the gamertag", text.includes(VISITOR.gamertag), text);
  session.check(
    "and the masked email, never the full one",
    text.includes("de***@example.test") && !text.includes("demo-visitor@"),
  );
  await context.close();
}

async function checkDeskFindsAndRecoversThePassport(session) {
  const { context, page } = await signInAs(
    session,
    { email: "help-desk@ejemplo.com", password: DEMO_PASSWORD },
    "/support/recovery",
  );

  for (const [how, query] of [
    ["email", VISITOR.email],
    ["gamertag", VISITOR.gamertag],
    ["full name", VISITOR.fullName],
  ]) {
    await searchPassport(page, query);
    await page.getByTestId("recovery-candidate").waitFor({ timeout: UI_TIMEOUT_MS });

    const card = await page.getByTestId("recovery-candidate").innerText();

    session.check(`the desk finds the passport by ${how}`, card.includes(`Gamertag: ${VISITOR.gamertag}`), card);
  }

  await page.getByRole("button", { name: "Recuperar este pasaporte" }).click();
  await page.getByRole("heading", { name: "Pasaporte recuperado" }).waitFor({ timeout: UI_TIMEOUT_MS });
  session.check(
    "the agent confirms and gets an access link for the visitor",
    (await page.getByLabel("Enlace de acceso").inputValue()).startsWith(`${session.baseUrl}/passport/claim/`),
  );
  await context.close();
}

async function checkDeskRegistersAWalkIn(session) {
  const { context, page } = await signInAs(
    session,
    { email: "help-desk@ejemplo.com", password: DEMO_PASSWORD },
    "/support/recovery",
  );

  const form = deskForm(page, "Registrar visitante");

  await form.getByLabel("Nombre completo").fill("Visitante de mesa");
  await form.getByLabel("Gamertag").fill("demo_walkin");
  await form.getByLabel("Correo").fill("demo-walkin@example.test");
  await form.getByRole("button", { name: "Registrar visitante" }).click();
  await page.getByRole("heading", { name: "Pasaporte creado" }).waitFor({ timeout: UI_TIMEOUT_MS });

  const pin = (await page.getByTestId("desk-pin").textContent()).trim();

  session.check("the desk registers a walk-in visitor and shows the PIN", /^\d{5}$/.test(pin), pin);
  session.check(
    "the registration is audited with the agent",
    count(session.database, "audit_logs", "action = 'visitor.register'") === 2,
  );
  await context.close();
}

// The sysadmin disables the stand administrator and reactivates it: it goes back to a pending invitation.
async function checkReactivation(session) {
  const { context, page } = await signInAs(session, SYSADMIN, "/admin");
  const row = page.locator("li", { hasText: "stand-admin@ejemplo.com" }).last();

  await row.getByRole("button", { name: "Desactivar" }).click();
  await row.getByRole("button", { name: "Sí, desactivar" }).click();
  await row.getByRole("button", { name: "Reactivar" }).waitFor({ timeout: UI_TIMEOUT_MS });
  await row.getByRole("button", { name: "Reactivar" }).click();
  await row.getByText(/Invitación pendiente/).waitFor({ timeout: UI_TIMEOUT_MS });

  const account = session.database
    .prepare("SELECT status, password_scrypt AS password FROM accounts WHERE email = 'stand-admin@ejemplo.com'")
    .get();

  session.check("a disabled account is reactivated as a pending invitation", account.status === "invited");
  session.check("and its old password is gone", account.password === null);
  session.check(
    "and the reactivation is audited",
    count(session.database, "audit_logs", "action = 'account.reactivate'") === 1,
  );
  await context.close();
}

async function signInAs(session, user, home) {
  const { context, page } = await openPage(session);

  await signIn(page, { baseUrl: session.baseUrl, ...user });
  await page.waitForURL((url) => url.pathname === home, { timeout: UI_TIMEOUT_MS });

  return { context, page };
}

async function openPage({ browser, errors }, viewport = { width: 1024, height: 768 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  return { context, page };
}

async function searchPassport(page, query) {
  const form = deskForm(page, "Busca el pasaporte del visitante");

  await form.getByLabel("Correo, gamertag o nombre completo").fill(query);
  await form.getByRole("button", { name: "Buscar pasaporte" }).click();
}

// The page holds two forms with the same labels: each one is found by its heading.
function deskForm(page, heading) {
  return page.locator("form", { has: page.getByRole("heading", { name: heading }) });
}

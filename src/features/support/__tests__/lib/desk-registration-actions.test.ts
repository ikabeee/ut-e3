/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import type * as NextServer from "next/server";
import { registerVisitorAtDeskAction } from "@features/support/lib/support-actions";
import { REGISTRATION_AGENT_RULE } from "@features/support/lib/server/desk-registration";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import {
  clearTables,
  createAccount,
  resetEventSettings,
  setClockToTheEvent,
} from "@features/support/__tests__/lib/server/support-server-utils";
import { hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { consumeAttempt } from "@shared/lib/server/rate-limit";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const nextServer = jest.requireActual<typeof NextServer>("next/server");

const updateTag = jest.spyOn(nextCache, "updateTag").mockImplementation(() => undefined);

jest.spyOn(nextServer, "after").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const ERRORS = SUPPORT_COPY.register.errors;

const RESULT = SUPPORT_COPY.register.result;

const accountIds: Record<string, string> = {};

let accountCount = 0;

beforeAll(() => {
  setClockToTheEvent();
});

afterAll(async () => {
  jest.useRealTimers();
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  stubCookies(createCookieJar());
  await clearTables();
  await resetEventSettings();
  updateTag.mockClear();
  accountCount += 1;

  // The audit log is insert-only, so every test has its own accounts and reads only the entries of its own.
  for (const role of ["help_desk", "sysadmin", "kof_admin"]) {
    accountIds[role] = (await createAccount(`${role}-reg-${accountCount}@ut.mx`, role)).id;
  }
});

describe("registerVisitorAtDeskAction", () => {
  it("creates the passport and gives the PIN and the link, audited with the agent", async () => {
    await createSession(accountIds.help_desk);

    const state = await registerVisitorAtDeskAction(null, createForm());

    expect(state).toMatchObject({
      status: "registered",
      fullName: "Ana Pérez",
      gamertag: "Desk_Ana",
      enrollment: "none",
      pin: expect.stringMatching(/^\d{5}$/),
      claimPath: expect.stringMatching(/^\/passport\/claim\/[\w-]{43}$/),
    });

    const visitor = await getPrisma().visitor.findFirstOrThrow({ where: { gamertag: "Desk_Ana" } });
    const pin = state.status === "registered" ? state.pin : "";

    expect(visitor.pinLookup).toBe(hashPinForLookup(pin));
    expect(updateTag).toHaveBeenCalledWith("visitor-pins");
    await expect(getPrisma().emailOutbox.count({ where: { to: "ana.desk@example.com" } })).resolves.toBe(1);

    const audit = await getPrisma().auditLog.findFirstOrThrow({ where: { actorId: accountIds.help_desk } });

    expect(audit).toMatchObject({ action: "visitor.register", entityId: visitor.id });
    expect(audit.detail).toEqual({ gamertag: "Desk_Ana", assisted: true });
  });

  it("lets the sysadmin use the desk too", async () => {
    await createSession(accountIds.sysadmin);

    await expect(registerVisitorAtDeskAction(null, createForm())).resolves.toMatchObject({ status: "registered" });
  });

  it.each([
    ["kof_admin", "/admin/kof"],
    ["anonymous", "/login"],
  ])("sends %s away without creating anything", async (role, destination) => {
    if (role !== "anonymous") await createSession(accountIds[role]);

    await expect(registerVisitorAtDeskAction(null, createForm())).rejects.toMatchObject({
      digest: expect.stringContaining(`;${destination};`),
    });
    await expect(getPrisma().visitor.count()).resolves.toBe(0);
  });

  it("checks the same fields as the public form before touching the database", async () => {
    await createSession(accountIds.help_desk);

    const state = await registerVisitorAtDeskAction(null, createForm({ gamertag: "x", email: "no-es-correo" }));

    expect(state).toMatchObject({
      status: "error",
      message: ERRORS.invalid,
      fieldErrors: { gamertag: expect.any(String), email: expect.any(String) },
    });
    await expect(getPrisma().visitor.count()).resolves.toBe(0);
  });

  it("refuses a used email, a blocked one and the email of a staff account with the same answer", async () => {
    await createSession(accountIds.help_desk);
    await getPrisma().emailBlocklist.create({ data: { email: "bloqueado@example.com" } });
    await registerVisitorAtDeskAction(null, createForm());

    const used = await registerVisitorAtDeskAction(null, createForm({ gamertag: "Otro_Tag" }));

    const blocked = await registerVisitorAtDeskAction(
      null,
      createForm({ gamertag: "Bloq_Tag", email: "bloqueado@example.com" }),
    );

    const staff = await registerVisitorAtDeskAction(
      null,
      createForm({ gamertag: "Staff_Tag", email: `help_desk-reg-${accountCount}@ut.mx` }),
    );

    expect([used, blocked, staff]).toEqual(Array(3).fill({ status: "error", message: ERRORS.rejected }));
    await expect(getPrisma().visitor.count()).resolves.toBe(1);
  });

  it("names a taken gamertag and gives the attempt back", async () => {
    await createSession(accountIds.help_desk);
    await registerVisitorAtDeskAction(null, createForm());

    const state = await registerVisitorAtDeskAction(null, createForm({ email: "otro@example.com" }));

    expect(state).toMatchObject({ status: "error", fieldErrors: { gamertag: ERRORS.gamertagTaken } });

    const row = await getPrisma().rateLimit.findFirstOrThrow({
      where: { key: `desk-registration:${accountIds.help_desk}` },
    });

    expect(row.count).toBe(1);
  });

  it("stops an agent after the hourly limit", async () => {
    await createSession(accountIds.help_desk);

    for (let attempt = 0; attempt < REGISTRATION_AGENT_RULE.limit; attempt += 1) {
      await consumeAttempt(`desk-registration:${accountIds.help_desk}`, REGISTRATION_AGENT_RULE);
    }

    await expect(registerVisitorAtDeskAction(null, createForm())).resolves.toEqual({
      status: "error",
      message: ERRORS.agentLimit,
    });
    await expect(getPrisma().visitor.count()).resolves.toBe(0);
  });

  it("does not register before the registration opens", async () => {
    await createSession(accountIds.help_desk);
    await resetEventSettings({ registrationOpensAt: new Date("2026-11-21T00:00:00.000Z") });

    await expect(registerVisitorAtDeskAction(null, createForm())).resolves.toEqual({
      status: "error",
      message: ERRORS.closed,
    });
  });
});

describe("registerVisitorAtDeskAction and the KOF", () => {
  it("enters the visitor in the tournament during the on-site sign-up, already checked in", async () => {
    await createSession(accountIds.help_desk);

    const state = await registerVisitorAtDeskAction(null, createForm({ enrollInTournament: "on" }));

    expect(state).toMatchObject({ status: "registered", enrollment: "enrolled" });

    const entry = await getPrisma().tournamentEntry.findFirstOrThrow({ include: { visitor: true } });

    expect(entry).toMatchObject({ channel: "onsite", status: "checked_in", registeredById: accountIds.help_desk });
    expect(entry.visitor.gamertag).toBe("Desk_Ana");
    expect(RESULT.enrollment.enrolled).toBeTruthy();
  });

  it("does not enter a visitor that was not asked for", async () => {
    await createSession(accountIds.help_desk);
    await registerVisitorAtDeskAction(null, createForm());

    await expect(getPrisma().tournamentEntry.count()).resolves.toBe(0);
  });

  it("keeps the passport but not the entry when the on-site sign-up is over, even if the form asks for it", async () => {
    await createSession(accountIds.help_desk);
    await resetEventSettings({ onsiteEndsAt: new Date("2026-11-20T17:45:00.000Z") });

    const state = await registerVisitorAtDeskAction(null, createForm({ enrollInTournament: "on" }));

    expect(state).toMatchObject({ status: "registered", enrollment: "notOnsite" });
    await expect(getPrisma().tournamentEntry.count()).resolves.toBe(0);
    await expect(getPrisma().visitor.count()).resolves.toBe(1);
  });
});

function createForm(fields: Record<string, string> = {}): FormData {
  const form = new FormData();
  const values = { fullName: "Ana Pérez", gamertag: "Desk_Ana", email: "ana.desk@example.com", ...fields };

  for (const [name, value] of Object.entries(values)) form.set(name, value);

  return form;
}

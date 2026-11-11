/**
 * @jest-environment node
 */
import { recoverPassportAction } from "@features/support/lib/support-actions";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { AGENT_RULE } from "@features/support/lib/server/passport-recovery";
import {
  clearTables,
  createAccount,
  createStand,
  createVisitor,
  setClockToTheEvent,
} from "@features/support/__tests__/lib/server/support-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { consumeAttempt } from "@shared/lib/server/rate-limit";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

let standId = "";

const ERRORS = SUPPORT_COPY.recovery.errors;

const ROLES = ["help_desk", "sysadmin", "stand_staff", "kof_admin", "raffle_admin"];

const accountIds: Record<string, string> = {};

let accountCount = 0;

beforeAll(async () => {
  setClockToTheEvent();
  await getPrisma().stand.deleteMany();
  standId = (await createStand()).id;
});

afterAll(async () => {
  jest.useRealTimers();
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  stubCookies(createCookieJar());
  await clearTables();
  await createVisitor("Neo_01", "Ana Pérez López");
  accountCount += 1;

  // A stand holds 3 staff accounts at most, so the ones of the previous tests are disabled to free their place.
  await getPrisma().account.updateMany({ where: { role: "stand_staff" }, data: { status: "disabled" } });

  // The audit log cannot be emptied, so every test has its own accounts and reads only the entries of its own.
  for (const role of ROLES) {
    const standAccount = role === "stand_staff" ? standId : undefined;

    accountIds[role] = (await createAccount(`${role}-${accountCount}@ut.mx`, role, standAccount)).id;
  }
});

describe("recoverPassportAction", () => {
  it.each(["help_desk", "sysadmin"])("lets a %s recover a passport", async (role) => {
    await createSession(accountIds[role]);

    const state = await recoverPassportAction(null, createForm("Ana Pérez López", "Neo_01"));

    expect(state).toMatchObject({ status: "recovered", gamertag: "Neo_01" });
    expect(state.status === "recovered" && state.claimPath).toMatch(/^\/passport\/claim\/[\w-]{43}$/);
    expect(await getPrisma().auditLog.count({ where: { actorId: accountIds[role] } })).toBe(1);
  });

  it.each([
    ["stand_staff", "/stand/kiosk"],
    ["kof_admin", "/admin/kof"],
    ["raffle_admin", "/admin/raffle"],
  ])("sends a %s to its home without recovering anything", async (role, home) => {
    await createSession(accountIds[role]);

    await expect(recoverPassportAction(null, createForm("Ana Pérez López", "Neo_01"))).rejects.toMatchObject({
      digest: expect.stringContaining(`;${home};`),
    });
    expect(await getPrisma().visitorDevice.count()).toBe(0);
  });

  it("sends a request without a session to /login", async () => {
    await expect(recoverPassportAction(null, createForm("Ana Pérez López", "Neo_01"))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
  });

  it("asks for both fields before touching the database", async () => {
    await createSession(accountIds.help_desk);

    expect(await recoverPassportAction(null, createForm("", "Neo_01"))).toEqual({
      status: "error",
      message: ERRORS.fullNameRequired,
    });
    expect(await getPrisma().auditLog.count({ where: { actorId: accountIds.help_desk } })).toBe(0);
  });

  it("tells a mismatch without saying whether the visitor exists", async () => {
    await createSession(accountIds.help_desk);

    const wrongName = await recoverPassportAction(null, createForm("Otra Persona", "Neo_01"));
    const unknown = await recoverPassportAction(null, createForm("Otra Persona", "Nadie"));

    expect(wrongName).toEqual({ status: "error", message: ERRORS.identityMismatch });
    expect(unknown).toEqual(wrongName);
  });

  it("stops an agent after 30 attempts in 10 minutes", async () => {
    await createSession(accountIds.help_desk);

    for (let attempt = 0; attempt < AGENT_RULE.limit; attempt += 1) {
      await consumeAttempt(`recovery-agent:${accountIds.help_desk}`, AGENT_RULE);
    }

    expect(await recoverPassportAction(null, createForm("Ana Pérez López", "Neo_01"))).toEqual({
      status: "error",
      message: ERRORS.agentLimit,
    });
    expect(await getPrisma().visitorDevice.count()).toBe(0);
  });

  it("stops the 4th recovery of the same visitor in an hour with a clear message", async () => {
    await createSession(accountIds.help_desk);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await recoverPassportAction(null, createForm("Ana Pérez López", "Neo_01"));
    }

    expect(await recoverPassportAction(null, createForm("Ana Pérez López", "Neo_01"))).toEqual({
      status: "error",
      message: ERRORS.visitorLimit,
    });
  });
});

function createForm(fullName: string, gamertag: string): FormData {
  const form = new FormData();

  form.set("fullName", fullName);
  form.set("gamertag", gamertag);

  return form;
}

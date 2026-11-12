/**
 * @jest-environment node
 */
import { recoverPassportAction, searchPassportsAction } from "@features/support/lib/support-actions";
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

let visitorId = "";

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
  visitorId = (await createVisitor("Neo_01", "Ana Pérez López")).id;
  accountCount += 1;

  // A stand holds 3 staff accounts at most, so the ones of the previous tests are disabled to free their place.
  await getPrisma().account.updateMany({ where: { role: "stand_staff" }, data: { status: "disabled" } });

  // The audit log cannot be emptied, so every test has its own accounts and reads only the entries of its own.
  for (const role of ROLES) {
    const standAccount = role === "stand_staff" ? standId : undefined;

    accountIds[role] = (await createAccount(`${role}-${accountCount}@ut.mx`, role, standAccount)).id;
  }
});

describe("searchPassportsAction", () => {
  it.each(["help_desk", "sysadmin"])("lets a %s search with what the visitor remembers", async (role) => {
    await createSession(accountIds[role]);

    const byEmail = await searchPassportsAction(null, createForm({ query: "neo_01@example.com" }));
    const byName = await searchPassportsAction(null, createForm({ query: "ana pérez  lópez" }));

    for (const state of [byEmail, byName]) {
      expect(state).toEqual({
        status: "found",
        candidates: [
          {
            visitorId,
            fullName: "Ana Pérez López",
            gamertag: "Neo_01",
            maskedEmail: "ne***@example.com",
            registeredAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
            standsVisited: 0,
          },
        ],
      });
    }
  });

  it.each([
    ["stand_staff", "/stand/kiosk"],
    ["kof_admin", "/admin/kof"],
    ["raffle_admin", "/admin/raffle"],
  ])("sends a %s to its home without searching anything", async (role, home) => {
    await createSession(accountIds[role]);

    await expect(searchPassportsAction(null, createForm({ query: "Neo_01" }))).rejects.toMatchObject({
      digest: expect.stringContaining(`;${home};`),
    });
    expect(await getPrisma().rateLimit.count()).toBe(0);
  });

  it("asks for something to search before touching the database", async () => {
    await createSession(accountIds.help_desk);

    expect(await searchPassportsAction(null, createForm({ query: " " }))).toEqual({
      status: "error",
      message: ERRORS.queryRequired,
    });
    expect(await getPrisma().auditLog.count({ where: { actorId: accountIds.help_desk } })).toBe(0);
  });

  it("answers the same for an email, a gamertag and a name that do not exist", async () => {
    await createSession(accountIds.help_desk);

    const states = [
      await searchPassportsAction(null, createForm({ query: "nadie@example.com" })),
      await searchPassportsAction(null, createForm({ query: "Nadie_9" })),
      await searchPassportsAction(null, createForm({ query: "Otra Persona" })),
    ];

    expect(states).toEqual(Array(3).fill({ status: "error", message: ERRORS.notFound }));
  });

  it("stops an agent after 30 attempts in 10 minutes", async () => {
    await createSession(accountIds.help_desk);

    for (let attempt = 0; attempt < AGENT_RULE.limit; attempt += 1) {
      await consumeAttempt(`recovery-agent:${accountIds.help_desk}`, AGENT_RULE);
    }

    expect(await searchPassportsAction(null, createForm({ query: "Neo_01" }))).toEqual({
      status: "error",
      message: ERRORS.agentLimit,
    });
  });
});

describe("recoverPassportAction", () => {
  it.each(["help_desk", "sysadmin"])("lets a %s recover the chosen passport", async (role) => {
    await createSession(accountIds[role]);

    const state = await recoverPassportAction(null, createForm({ visitorId }));

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

    await expect(recoverPassportAction(null, createForm({ visitorId }))).rejects.toMatchObject({
      digest: expect.stringContaining(`;${home};`),
    });
    expect(await getPrisma().visitorDevice.count()).toBe(0);
  });

  it("sends a request without a session to /login", async () => {
    await expect(recoverPassportAction(null, createForm({ visitorId }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
  });

  it("asks to choose a passport before touching the database", async () => {
    await createSession(accountIds.help_desk);

    expect(await recoverPassportAction(null, createForm({}))).toEqual({
      status: "error",
      message: ERRORS.targetRequired,
    });
    expect(await getPrisma().auditLog.count({ where: { actorId: accountIds.help_desk } })).toBe(0);
  });

  it("answers not found for an id that does not exist", async () => {
    await createSession(accountIds.help_desk);

    expect(await recoverPassportAction(null, createForm({ visitorId: "no-existe" }))).toEqual({
      status: "error",
      message: ERRORS.notFound,
    });
    expect(await getPrisma().visitorDevice.count()).toBe(0);
  });

  it("stops the 4th recovery of the same visitor in an hour with a clear message", async () => {
    await createSession(accountIds.help_desk);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await recoverPassportAction(null, createForm({ visitorId }));
    }

    expect(await recoverPassportAction(null, createForm({ visitorId }))).toEqual({
      status: "error",
      message: ERRORS.visitorLimit,
    });
  });
});

function createForm(fields: Record<string, string>): FormData {
  const form = new FormData();

  for (const [name, value] of Object.entries(fields)) form.set(name, value);

  return form;
}

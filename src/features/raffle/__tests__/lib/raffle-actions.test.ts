/**
 * @jest-environment node
 */
import {
  closeRaffleAction,
  decideDrawAction,
  registerPrizeAction,
  spinRaffleAction,
} from "@features/raffle/lib/raffle-actions";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import {
  createEventSettings,
  createRaffleAdmin,
  createVisitorWithTickets,
  DURING_RAFFLE,
} from "@features/raffle/__tests__/lib/server/raffle-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { stubAfter } from "@shared/__tests__/lib/server/headers-stub";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const ERRORS = RAFFLE_COPY.admin.errors;

const afterStub = stubAfter();

beforeAll(async () => {
  await createEventSettings();
  await createVisitorWithTickets("Neo");
  await createVisitorWithTickets("Trinity");
  jest.useFakeTimers({ now: DURING_RAFFLE, doNotFake: ["setTimeout", "setImmediate", "nextTick", "queueMicrotask"] });
});

afterAll(async () => {
  jest.useRealTimers();
  afterStub.restore();
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(() => {
  stubCookies(createCookieJar());
});

function formOf(fields: Record<string, string>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => form.set(name, value));

  return form;
}

async function signInAs(role: string): Promise<string> {
  const account =
    role === "raffle_admin"
      ? await createRaffleAdmin()
      : await getPrisma().account.create({
          data: { email: `${role}-${Date.now()}@ut.mx`, name: role, role, status: "active", password: "hash" },
        });

  await createSession(account.id);

  return account.id;
}

describe("raffle Server Actions", () => {
  it("send anyone who is not a raffle administrator to /login", async () => {
    await signInAs("sysadmin");

    await expect(spinRaffleAction(null, formOf({ requestId: crypto.randomUUID() }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
    await expect(closeRaffleAction()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it("refuse a spin without a valid request id", async () => {
    await signInAs("raffle_admin");

    expect(await spinRaffleAction(null, formOf({ requestId: "1; DROP TABLE" }))).toEqual({
      status: "error",
      message: ERRORS.invalidRequest,
    });
  });

  it("spin, block the second spin, confirm the winner and send the email after the answer", async () => {
    await signInAs("raffle_admin");

    const spun = await spinRaffleAction(null, formOf({ requestId: crypto.randomUUID() }));

    if (spun.status !== "drawn") throw new Error(spun.message);

    expect(await spinRaffleAction(null, formOf({ requestId: crypto.randomUUID() }))).toEqual({
      status: "error",
      message: ERRORS.undecided(spun.draw.ticketNumber),
    });

    await signInAs("raffle_admin");

    expect(await spinRaffleAction(null, formOf({ requestId: crypto.randomUUID() }))).toEqual({
      status: "error",
      message: ERRORS.busy,
    });

    const decided = await decideDrawAction(null, formOf({ drawId: spun.draw.id, outcome: "winner" }));

    expect(decided).toEqual({ status: "done" });
    expect(afterStub.callbacks).toHaveLength(1);
  });

  it("validate the decision and the prize before touching the database", async () => {
    await signInAs("raffle_admin");

    const draw = await getPrisma().raffleDraw.findFirstOrThrow({ where: { outcome: "winner" } });

    expect(await decideDrawAction(null, formOf({ drawId: draw.id, outcome: "maybe" }))).toMatchObject({
      message: ERRORS.invalidRequest,
    });
    expect(await registerPrizeAction(null, formOf({ drawId: draw.id, prizeName: "   " }))).toMatchObject({
      message: ERRORS.prizeRequired,
    });
    expect(await registerPrizeAction(null, formOf({ drawId: draw.id, prizeName: "x".repeat(81) }))).toMatchObject({
      message: ERRORS.prizeTooLong,
    });
    expect(
      await registerPrizeAction(null, formOf({ drawId: draw.id, prizeName: "  Audífonos   inalámbricos " })),
    ).toEqual({
      status: "done",
    });
    expect((await getPrisma().raffleDraw.findUniqueOrThrow({ where: { id: draw.id } })).prizeName).toBe(
      "Audífonos inalámbricos",
    );
    expect(await decideDrawAction(null, formOf({ drawId: draw.id, outcome: "discarded" }))).toMatchObject({
      message: ERRORS.alreadyDecided,
    });
  });

  it("close the raffle, after which nobody spins", async () => {
    await signInAs("raffle_admin");

    expect(await closeRaffleAction()).toEqual({ status: "done" });
    expect(await spinRaffleAction(null, formOf({ requestId: crypto.randomUUID() }))).toEqual({
      status: "error",
      message: ERRORS.closed,
    });
    expect(await closeRaffleAction()).toEqual({ status: "error", message: ERRORS.closed });
  });
});

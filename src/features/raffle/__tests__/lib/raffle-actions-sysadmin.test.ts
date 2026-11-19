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

let sysadminId = "";

beforeAll(async () => {
  await createEventSettings();
  await createVisitorWithTickets("Neo");
  await createVisitorWithTickets("Trinity");
  sysadminId = (
    await getPrisma().account.create({
      data: { email: "sysadmin@ut.mx", name: "Sysadmin", role: "sysadmin", status: "active", password: "hash" },
    })
  ).id;
  jest.useFakeTimers({ now: DURING_RAFFLE, doNotFake: ["setTimeout", "setImmediate", "nextTick", "queueMicrotask"] });
});

afterAll(async () => {
  jest.useRealTimers();
  afterStub.restore();
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  stubCookies(createCookieJar());
  await createSession(sysadminId);
});

function formOf(fields: Record<string, string>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => form.set(name, value));

  return form;
}

async function signInAsAnimator() {
  await createSession((await createRaffleAdmin()).id);
}

describe("the sysadmin operates the raffle as a raffle administrator (S5)", () => {
  it("spins, is blocked by its own undecided spin, locks out an animator, decides, registers the prize and closes, all under its account", async () => {
    const spun = await spinRaffleAction(null, formOf({ requestId: crypto.randomUUID() }));

    if (spun.status !== "drawn") throw new Error(spun.message);

    expect(await spinRaffleAction(null, formOf({ requestId: crypto.randomUUID() }))).toEqual({
      status: "error",
      message: ERRORS.undecided(spun.draw.ticketNumber),
    });

    await signInAsAnimator();

    expect(await spinRaffleAction(null, formOf({ requestId: crypto.randomUUID() }))).toEqual({
      status: "error",
      message: ERRORS.busy,
    });

    await createSession(sysadminId);

    expect(await decideDrawAction(null, formOf({ drawId: spun.draw.id, outcome: "winner" }))).toEqual({
      status: "done",
    });
    expect(await registerPrizeAction(null, formOf({ drawId: spun.draw.id, prizeName: "Audífonos" }))).toEqual({
      status: "done",
    });
    expect(await closeRaffleAction()).toEqual({ status: "done" });

    const draw = await getPrisma().raffleDraw.findUniqueOrThrow({ where: { id: spun.draw.id } });

    expect(draw).toMatchObject({ drawnById: sysadminId, prizeById: sysadminId, outcome: "winner" });
    expect(await getPrisma().auditLog.count({ where: { actorId: sysadminId } })).toBeGreaterThanOrEqual(4);
  });
});

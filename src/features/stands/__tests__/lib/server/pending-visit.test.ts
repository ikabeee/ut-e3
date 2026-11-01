/**
 * @jest-environment node
 */
import {
  answerPendingVisit,
  cancelPendingVisit,
  PENDING_VISIT_TTL_MS,
  requestVisit,
} from "@features/stands/lib/server/pending-visit-mutations";
import { getPendingVisitStatus, getVisitorPendingVisit } from "@features/stands/lib/server/pending-visit-queries";
import {
  createEventSettings,
  createStand,
  createStandAccount,
  createVisitor,
  CUTOFF_AT,
} from "@features/stands/__tests__/lib/server/stands-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const RATINGS = { gameRating: 5, standRating: 4, artRating: 3 };

const NOW = new Date(CUTOFF_AT.getTime() - 60 * 60 * 1000);

const PIN = "12345";

let standId = "";

let staffId = "";

let visitorId = "";

beforeAll(async () => {
  await createEventSettings();
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().pendingVisit.deleteMany();
  await getPrisma().vote.deleteMany();
  await getPrisma().raffleTicket.deleteMany();
  await getPrisma().checkIn.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().account.deleteMany();
  await getPrisma().game.deleteMany();
  await getPrisma().stand.deleteMany();
  visitorId = (await createVisitor("Jugador1", PIN)).id;
  standId = (await createStand(1, "Pixel Quest")).id;
  staffId = (await createStandAccount("staff@ut.mx", "stand_staff", standId)).id;
});

describe("requestVisit", () => {
  it("leaves a visit waiting that expires after three minutes", async () => {
    const result = await start();

    expect(result).toEqual({ status: "requested", pendingVisitId: expect.any(String) });
    expect(await getPrisma().pendingVisit.findFirstOrThrow()).toMatchObject({
      visitorId,
      standId,
      requestedById: staffId,
      answeredAt: null,
      expiresAt: new Date(NOW.getTime() + PENDING_VISIT_TTL_MS),
    });
  });

  it.each([
    ["a PIN that belongs to nobody", "99999", "unknownPin"],
    ["a PIN of a different passport", "54321", "unknownPin"],
  ])("refuses %s", async (_case, pin, status) => {
    expect(await requestVisit({ standId, scannedById: staffId, pin }, NOW)).toEqual({ status });
    expect(await getPrisma().pendingVisit.count()).toBe(0);
  });

  it("refuses the visit after the cutoff", async () => {
    expect(await requestVisit({ standId, scannedById: staffId, pin: PIN }, CUTOFF_AT)).toEqual({ status: "closed" });
  });

  it("replaces the visit that was waiting at another stand", async () => {
    const first = await start();
    const other = await createStand(2);
    const otherStaff = await createStandAccount("other@ut.mx", "stand_staff", other.id);
    const second = await requestVisit({ standId: other.id, scannedById: otherStaff.id, pin: PIN }, NOW);

    expect(await getPrisma().pendingVisit.count()).toBe(1);
    expect(first.status === "requested" && (await getPendingVisitStatus(first.pendingVisitId, standId, NOW))).toBe(
      "expired",
    );
    expect(second).toMatchObject({ status: "requested" });
  });

  it("refuses a passport that already visited the stand", async () => {
    await answered();

    expect(await requestVisit({ standId, scannedById: staffId, pin: PIN }, NOW)).toEqual({ status: "alreadyVisited" });
  });
});

describe("answerPendingVisit", () => {
  it("records the visit, the survey and who scanned it, and marks the visit as answered", async () => {
    const started = await start();

    expect(await answerPendingVisit(visitorId, RATINGS, NOW)).toEqual({ status: "registered", ticketsGranted: 0 });
    expect(await getPrisma().checkIn.findFirstOrThrow({ include: { vote: true } })).toMatchObject({
      visitorId,
      standId,
      scannedById: staffId,
      vote: RATINGS,
    });
    expect(started.status === "requested" && (await getPendingVisitStatus(started.pendingVisitId, standId, NOW))).toBe(
      "answered",
    );
  });

  it("grants the ticket of the ninth visit together with the visit", async () => {
    for (let number = 2; number <= 9; number += 1) {
      const previous = await createStand(number);

      await getPrisma().checkIn.create({ data: { visitorId, standId: previous.id } });
    }
    await start();

    expect(await answerPendingVisit(visitorId, RATINGS, NOW)).toEqual({ status: "registered", ticketsGranted: 1 });
  });

  it("has nothing to record without a pending visit", async () => {
    expect(await answerPendingVisit(visitorId, RATINGS, NOW)).toEqual({ status: "noPending" });
  });

  it("has nothing to record once the visit expired", async () => {
    await start();

    const late = new Date(NOW.getTime() + PENDING_VISIT_TTL_MS);

    expect(await answerPendingVisit(visitorId, RATINGS, late)).toEqual({ status: "noPending" });
    expect(await getPrisma().checkIn.count()).toBe(0);
  });

  it("records nothing and keeps the visit waiting when the cutoff has passed", async () => {
    await requestVisit({ standId, scannedById: staffId, pin: PIN }, new Date(CUTOFF_AT.getTime() - 1000));

    expect(await answerPendingVisit(visitorId, RATINGS, CUTOFF_AT)).toEqual({ status: "closed" });
    expect(await getPrisma().checkIn.count()).toBe(0);
  });

  it("rolls the visit back when the survey is invalid", async () => {
    await start();

    await expect(answerPendingVisit(visitorId, { ...RATINGS, artRating: 6 }, NOW)).rejects.toThrow();
    expect(await getPrisma().checkIn.count()).toBe(0);
    expect(await getPrisma().pendingVisit.count({ where: { answeredAt: null } })).toBe(1);
  });

  it("records the visit only once when the visitor answers twice at the same time", async () => {
    await start();

    const results = await Promise.all([
      answerPendingVisit(visitorId, RATINGS, NOW),
      answerPendingVisit(visitorId, RATINGS, NOW),
    ]);

    expect(results.filter((result) => result.status === "registered")).toHaveLength(1);
    expect(await getPrisma().checkIn.count()).toBe(1);
  });
});

describe("cancelPendingVisit", () => {
  it("drops the visit of the stand", async () => {
    const started = await start();

    await cancelPendingVisit(started.status === "requested" ? started.pendingVisitId : "", standId);

    expect(await getPrisma().pendingVisit.count()).toBe(0);
  });

  it("keeps a visit that was already answered", async () => {
    const started = await answered();

    await cancelPendingVisit(started, standId);

    expect(await getPrisma().pendingVisit.count()).toBe(1);
  });
});

describe("getVisitorPendingVisit", () => {
  it("shows the stand and the game the visitor is rating", async () => {
    const started = await start();

    expect(await getVisitorPendingVisit(visitorId, NOW)).toEqual({
      id: started.status === "requested" ? started.pendingVisitId : "",
      standCode: "ZA-S1",
      gameName: "Pixel Quest",
    });
  });

  it.each([
    ["there is no visit waiting", async () => undefined],
    [
      "the visit expired",
      async () => {
        await start();
      },
    ],
  ])("shows nothing when %s", async (_case, setUp) => {
    await setUp();

    const later = new Date(NOW.getTime() + PENDING_VISIT_TTL_MS + 1000);

    expect(await getVisitorPendingVisit(visitorId, later)).toBeNull();
  });

  it("shows nothing once the visit was answered", async () => {
    await answered();

    expect(await getVisitorPendingVisit(visitorId, NOW)).toBeNull();
  });
});

describe("getPendingVisitStatus", () => {
  it("follows the visit from waiting to expired", async () => {
    const started = await start();
    const id = started.status === "requested" ? started.pendingVisitId : "";

    expect(await getPendingVisitStatus(id, standId, NOW)).toBe("waiting");
    expect(await getPendingVisitStatus(id, standId, new Date(NOW.getTime() + PENDING_VISIT_TTL_MS))).toBe("expired");
  });

  it("does not tell the status of a visit of another stand", async () => {
    const started = await start();
    const other = await createStand(2);

    expect(
      await getPendingVisitStatus(started.status === "requested" ? started.pendingVisitId : "", other.id, NOW),
    ).toBe("expired");
  });
});

function start() {
  return requestVisit({ standId, scannedById: staffId, pin: PIN }, NOW);
}

async function answered(): Promise<string> {
  const started = await start();

  await answerPendingVisit(visitorId, RATINGS, NOW);

  return started.status === "requested" ? started.pendingVisitId : "";
}

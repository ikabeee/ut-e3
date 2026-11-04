/**
 * @jest-environment node
 */
import type { ReceivedEntry } from "@features/stands/lib/queued-visit-input";
import { requestVisit } from "@features/stands/lib/server/pending-visit-mutations";
import { registerQueuedVisits } from "@features/stands/lib/server/queued-visit-mutations";
import { getRejectedVisitNotices } from "@features/stands/lib/server/rejected-visit-queries";
import {
  createEventSettings,
  createStand,
  createStandAccount,
  createVisitor,
} from "@features/stands/__tests__/lib/server/stands-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const RATINGS = { gameRating: 4, standRating: 5, artRating: 3 };

const PIN = "12345";

// Cancun times of the event day (UTC-5): the cutoff of the seed is 16:50 and the raffle starts at 18:00.
const at = (time: string) => new Date(`2026-11-20T${time}:00.000Z`);

let visitorId = "";

let ids = { stand: "", staff: "" };

let sequence = 0;

beforeAll(async () => {
  await createEventSettings();
  visitorId = (await createVisitor("Jugador1", PIN)).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().rejectedVisit.deleteMany();
  await getPrisma().pendingVisit.deleteMany();
  await getPrisma().vote.deleteMany();
  await getPrisma().raffleTicket.deleteMany();
  await getPrisma().checkIn.deleteMany();
  await getPrisma().account.deleteMany();
  await getPrisma().game.deleteMany();
  await getPrisma().stand.deleteMany();

  const stand = await createStand(3, "Pixel Quest");

  ids = { stand: stand.id, staff: (await createStandAccount("staff@ut.mx", "stand_staff", stand.id)).id };
});

describe("registerQueuedVisits", () => {
  it("records a queued visit with its id, the hour of the PIN and who had the kiosk open (UT-CI-01, UT-CI-08)", async () => {
    const visit = entry({ scannedAt: at("21:49") });

    expect(await send([visit], at("22:40"))).toEqual([{ id: visit.id, status: "ok" }]);

    const checkIn = await getPrisma().checkIn.findUniqueOrThrow({ where: { id: visit.id }, include: { vote: true } });

    expect(checkIn).toMatchObject({ visitorId, standId: ids.stand, scannedById: ids.staff });
    expect(checkIn.scannedAt).toEqual(at("21:49"));
    expect(checkIn.checkedInAt).toEqual(at("22:40"));
    expect(checkIn.vote).toMatchObject(RATINGS);
  });

  it("answers duplicate to the same batch sent twice and records it once (UT-CI-04)", async () => {
    const visit = entry({ scannedAt: at("20:00") });

    await send([visit], at("20:05"));

    expect(await send([visit], at("20:06"))).toEqual([{ id: visit.id, status: "duplicate" }]);
    expect(await getPrisma().checkIn.count()).toBe(1);
  });

  it("answers duplicate to a second visit of the PIN with another id, and keeps the first survey (UT-CI-05)", async () => {
    await send([entry({ scannedAt: at("20:00") })], at("20:05"));

    const second = entry({ scannedAt: at("20:10"), ratings: { gameRating: 1, standRating: 1, artRating: 1 } });

    expect(await send([second], at("20:15"))).toEqual([{ id: second.id, status: "duplicate" }]);
    expect(await getPrisma().vote.findMany()).toEqual([expect.objectContaining(RATINGS)]);
  });

  it("answers late to a PIN taken after the cutoff, and the passport gets the notice (UT-CI-09, RF-24)", async () => {
    const visit = entry({ scannedAt: at("21:51") });

    expect(await send([visit], at("21:52"))).toEqual([{ id: visit.id, status: "late" }]);
    expect(await getPrisma().checkIn.count()).toBe(0);
    expect(await getRejectedVisitNotices(visitorId)).toEqual([{ id: visit.id, standCode: "ZA-S3" }]);
  });

  it("answers late when it arrives once the raffle started, even if the PIN was before the cutoff (UT-CI-10)", async () => {
    const visit = entry({ scannedAt: at("21:49") });

    expect(await send([visit], at("23:00"))).toEqual([{ id: visit.id, status: "late" }]);
    expect(await send([visit], at("23:01"))).toEqual([{ id: visit.id, status: "late" }]);
    expect(await getPrisma().rejectedVisit.count()).toBe(1);
  });

  it("accepts a clock that runs behind and keeps who sent it (UT-CI-12)", async () => {
    const visit = entry({ scannedAt: at("21:48") });

    expect(await send([visit], at("22:20"))).toEqual([{ id: visit.id, status: "ok" }]);
    expect((await getPrisma().checkIn.findUniqueOrThrow({ where: { id: visit.id } })).scannedById).toBe(ids.staff);
  });

  it("answers unknownVisitor to a PIN that is nobody's and records nothing, not even a notice (UT-CI-13)", async () => {
    const visit = entry({ pin: "99999", scannedAt: at("20:00") });

    expect(await send([visit], at("20:05"))).toEqual([{ id: visit.id, status: "unknownVisitor" }]);
    expect(await getPrisma().checkIn.count()).toBe(0);
    expect(await getPrisma().vote.count()).toBe(0);
    expect(await getPrisma().rejectedVisit.count()).toBe(0);
  });

  it("gives each visit of a batch its own answer and saves the valid one (UT-CI-14)", async () => {
    await createVisitor("Jugador2", "22222");

    const batch = [
      entry({ pin: "22222", scannedAt: at("20:00") }),
      entry({ scannedAt: at("21:55") }),
      entry({ pin: "99999", scannedAt: at("20:01") }),
      { id: nextId(), visit: null },
    ];

    expect((await send(batch, at("22:00"))).map((result) => result.status)).toEqual([
      "ok",
      "late",
      "unknownVisitor",
      "invalid",
    ]);
    expect(await getPrisma().checkIn.count()).toBe(1);
  });

  it("refuses every visit of a stand without its game (UT-CI-07)", async () => {
    await getPrisma().game.deleteMany();

    const visit = entry({ scannedAt: at("20:00") });

    expect(await send([visit], at("20:05"))).toEqual([{ id: visit.id, status: "standWithoutGame" }]);
  });

  it("drops a pending visit of the same passport at the stand once the queued one is recorded", async () => {
    await requestVisit({ standId: ids.stand, scannedById: ids.staff, pin: PIN }, at("20:00"));
    await send([entry({ scannedAt: at("20:01") })], at("20:02"));

    expect(await getPrisma().pendingVisit.count()).toBe(0);
  });
});

function send(entries: ReceivedEntry[], receivedAt: Date) {
  return registerQueuedVisits({ standId: ids.stand, scannedById: ids.staff, entries }, receivedAt);
}

function entry(overrides: { pin?: string; scannedAt: Date; ratings?: typeof RATINGS }): ReceivedEntry {
  const id = nextId();

  return {
    id,
    visit: { id, pin: overrides.pin ?? PIN, ratings: overrides.ratings ?? RATINGS, scannedAt: overrides.scannedAt },
  };
}

function nextId(): string {
  sequence += 1;

  return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

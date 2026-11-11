/**
 * @jest-environment node
 */
import { closeRaffle, decideDraw, registerPrize, spinRaffle } from "@features/raffle/lib/server/raffle-mutations";
import {
  getRaffleAdminSnapshot,
  getRaffleLiveSnapshot,
  getVisitorRaffleWin,
} from "@features/raffle/lib/server/raffle-queries";
import {
  createEventSettings,
  createRaffleAdmin,
  createVisitorWithTickets,
  DURING_RAFFLE,
  nextRequestId,
  RAFFLE_STARTS_AT,
} from "@features/raffle/__tests__/lib/server/raffle-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

let adminId = "";

let neoId = "";

let trinityId = "";

// One raffle for the whole file, told in order: a discarded ticket, a winner, its prize and the closing.
beforeAll(async () => {
  await createEventSettings();
  adminId = (await createRaffleAdmin("Animador Uno")).id;
  neoId = (await createVisitorWithTickets("Neo", [9, 18])).id;
  trinityId = (await createVisitorWithTickets("Trinity")).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

async function spinFirst(): Promise<string> {
  const result = await spinRaffle({
    actorId: adminId,
    requestId: nextRequestId(),
    now: DURING_RAFFLE,
    randomInt: () => 0,
  });

  if (result.status !== "drawn") throw new Error(result.status);

  return result.draw.id;
}

describe("the raffle as the screens read it", () => {
  it("is upcoming before the start, with no draw and no winners", async () => {
    const snapshot = await getRaffleLiveSnapshot(new Date(RAFFLE_STARTS_AT.getTime() - 1));

    expect(snapshot).toMatchObject({ phase: "upcoming", latest: null, winners: [], revision: 0 });
    expect(snapshot.startsAt).toBe(RAFFLE_STARTS_AT.toISOString());
  });

  it("shows the pending ticket on stage and in the panel, and raises the revision", async () => {
    await spinFirst();

    const live = await getRaffleLiveSnapshot(DURING_RAFFLE);
    const admin = await getRaffleAdminSnapshot(DURING_RAFFLE);

    expect(live).toMatchObject({ phase: "open", latest: { gamertag: "Neo", outcome: "pending" }, revision: 1 });
    expect(admin).toMatchObject({ activeTickets: 1, pending: { gamertag: "Neo", drawnByName: "Animador Uno" } });
  });

  it("never sends names or emails to the public screens", async () => {
    const text = JSON.stringify(await getRaffleLiveSnapshot(DURING_RAFFLE));

    expect(text).not.toContain("@example.com");
    expect(text).not.toContain("Nombre Neo");
    expect(text).not.toContain("Animador");
  });

  it("lists confirmed winners with their prize, and gives the passport its win (RF-25, RF-56)", async () => {
    const drawId = (await getPrisma().raffleDraw.findFirstOrThrow({ where: { outcome: "pending" } })).id;

    await decideDraw({ actorId: adminId, drawId, outcome: "discarded", now: DURING_RAFFLE });

    const winnerId = await spinFirst();

    await decideDraw({ actorId: adminId, drawId: winnerId, outcome: "winner", now: DURING_RAFFLE });

    expect(await getVisitorRaffleWin(neoId)).toBeNull();
    expect(await getVisitorRaffleWin(trinityId)).toMatchObject({
      prizeName: null,
      decidedAt: DURING_RAFFLE.toISOString(),
    });

    await registerPrize(adminId, { drawId: winnerId, prizeName: "Audífonos" });

    const live = await getRaffleLiveSnapshot(DURING_RAFFLE);
    const admin = await getRaffleAdminSnapshot(DURING_RAFFLE);

    expect(live.winners).toEqual([expect.objectContaining({ gamertag: "Trinity", prizeName: "Audífonos" })]);
    expect(live.winners[0]).not.toHaveProperty("prizeByName");
    expect(admin).toMatchObject({ discardedCount: 1, activeTickets: 0, pending: null });
    expect(admin.winners[0]).toMatchObject({ prizeByName: "Animador Uno" });
    expect(await getVisitorRaffleWin(trinityId)).toMatchObject({ prizeName: "Audífonos" });
    expect(live.revision).toBe(5);
  });

  it("is closed once an administrator closes it", async () => {
    await closeRaffle(adminId, DURING_RAFFLE);

    const admin = await getRaffleAdminSnapshot(DURING_RAFFLE);

    expect(admin).toMatchObject({ phase: "closed", closedAt: DURING_RAFFLE.toISOString(), revision: 6 });
  });
});

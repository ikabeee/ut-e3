/**
 * @jest-environment node
 */
import { registerVisit, type NewVisit } from "@features/stands/lib/server/visit-mutations";
import { checkVisit, getKioskStand } from "@features/stands/lib/server/visit-queries";
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

const ONE_MINUTE_BEFORE_CUTOFF = new Date(CUTOFF_AT.getTime() - 60 * 1000);

const PIN = "12345";

let staffId = "";

let visitorId = "";

beforeAll(async () => {
  await createEventSettings();
  visitorId = (await createVisitor("Jugador1", PIN)).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().vote.deleteMany();
  await getPrisma().raffleTicket.deleteMany();
  await getPrisma().checkIn.deleteMany();
  await getPrisma().account.deleteMany();
  await getPrisma().game.deleteMany();
  await getPrisma().stand.deleteMany();
});

describe("registerVisit", () => {
  it("records the visit, who had the kiosk open and the survey together", async () => {
    const { visit } = await setUpStand(1);

    expect(await registerVisit(visit, ONE_MINUTE_BEFORE_CUTOFF)).toEqual({ status: "registered", ticketsGranted: 0 });

    const checkIn = await getPrisma().checkIn.findFirstOrThrow({ include: { vote: true } });

    expect(checkIn).toMatchObject({ visitorId, standId: visit.standId, scannedById: staffId });
    expect(checkIn.checkedInAt).toEqual(ONE_MINUTE_BEFORE_CUTOFF);
    expect(checkIn.vote).toMatchObject({ visitorId, standId: visit.standId, ...RATINGS });
  });

  it("grants the first ticket with the 9th visit and none before", async () => {
    for (let number = 1; number <= 8; number += 1) {
      const { visit } = await setUpStand(number);

      await registerVisit(visit, ONE_MINUTE_BEFORE_CUTOFF);
    }

    expect(await getPrisma().raffleTicket.count()).toBe(0);

    const ninth = await setUpStand(9);

    expect(await registerVisit(ninth.visit, ONE_MINUTE_BEFORE_CUTOFF)).toEqual({
      status: "registered",
      ticketsGranted: 1,
    });
    expect(await getPrisma().raffleTicket.findMany({ select: { visitorId: true, milestone: true } })).toEqual([
      { visitorId, milestone: 9 },
    ]);
  });

  it("refuses a second visit of the same passport to the same stand", async () => {
    const { visit } = await setUpStand(1);

    await registerVisit(visit, ONE_MINUTE_BEFORE_CUTOFF);

    expect(await registerVisit(visit, ONE_MINUTE_BEFORE_CUTOFF)).toEqual({ status: "alreadyVisited" });
    expect(await getPrisma().checkIn.count()).toBe(1);
    expect(await getPrisma().vote.count()).toBe(1);
  });

  it("records only one visit when the same passport is sent twice at once", async () => {
    const { visit } = await setUpStand(1);

    const results = await Promise.all([
      registerVisit(visit, ONE_MINUTE_BEFORE_CUTOFF),
      registerVisit(visit, ONE_MINUTE_BEFORE_CUTOFF),
    ]);

    expect(results.map((result) => result.status).toSorted()).toEqual(["alreadyVisited", "registered"]);
    expect(await getPrisma().checkIn.count()).toBe(1);
  });

  it("leaves no check-in behind when the survey cannot be saved (RF-28)", async () => {
    const { visit } = await setUpStand(1);

    await expect(
      registerVisit({ ...visit, ratings: { ...RATINGS, artRating: 6 } }, ONE_MINUTE_BEFORE_CUTOFF),
    ).rejects.toThrow();

    expect(await getPrisma().checkIn.count()).toBe(0);
    expect(await getPrisma().vote.count()).toBe(0);
  });

  it.each([
    ["at the cutoff", CUTOFF_AT, "closed"],
    ["after the cutoff", new Date(CUTOFF_AT.getTime() + 60 * 1000), "closed"],
  ])("refuses a visit %s", async (_case, now, status) => {
    const { visit } = await setUpStand(1);

    expect(await registerVisit(visit, now)).toEqual({ status });
    expect(await getPrisma().checkIn.count()).toBe(0);
  });

  it("refuses a PIN that belongs to nobody", async () => {
    const { visit } = await setUpStand(1);

    expect(await registerVisit({ ...visit, pin: "99999" }, ONE_MINUTE_BEFORE_CUTOFF)).toEqual({
      status: "unknownPin",
    });
  });

  it("refuses the PIN of an excluded visitor, before and after the survey (UT-CI-19)", async () => {
    const { visit } = await setUpStand(1);
    const excluded = await createVisitor("Excluido", "54321");

    await getPrisma().visitor.update({
      where: { id: excluded.id },
      data: { excludedAt: ONE_MINUTE_BEFORE_CUTOFF, excludedReason: "Integrante de un equipo" },
    });

    expect(await checkVisit(visit.standId, "54321", ONE_MINUTE_BEFORE_CUTOFF)).toEqual({ status: "excluded" });
    expect(await registerVisit({ ...visit, pin: "54321" }, ONE_MINUTE_BEFORE_CUTOFF)).toEqual({ status: "excluded" });
    expect(await getPrisma().checkIn.count({ where: { visitorId: excluded.id } })).toBe(0);
  });

  it("refuses visits while the stand has no game (RF-34)", async () => {
    const { visit } = await setUpStand(1, null);

    expect(await registerVisit(visit, ONE_MINUTE_BEFORE_CUTOFF)).toEqual({ status: "standWithoutGame" });
    expect(await getPrisma().checkIn.count()).toBe(0);
  });
});

describe("checkVisit", () => {
  it("answers the visitor of the PIN when the visit can be recorded", async () => {
    const { visit } = await setUpStand(1);

    expect(await checkVisit(visit.standId, PIN, ONE_MINUTE_BEFORE_CUTOFF)).toEqual({ status: "ready", visitorId });
  });

  it("answers that the passport already visited the stand", async () => {
    const { visit } = await setUpStand(1);

    await registerVisit(visit, ONE_MINUTE_BEFORE_CUTOFF);

    expect(await checkVisit(visit.standId, PIN, ONE_MINUTE_BEFORE_CUTOFF)).toEqual({ status: "alreadyVisited" });
  });
});

describe("getKioskStand", () => {
  it("names the stand by its code and the game it shows", async () => {
    const stand = await createStand(3, "Pixel Quest");

    expect(await getKioskStand(stand.id)).toEqual({ code: "ZA-S3", gameName: "Pixel Quest" });
  });

  it("has no game name until the stand registers its game", async () => {
    const stand = await createStand(4, null);

    expect(await getKioskStand(stand.id)).toEqual({ code: "ZA-S4", gameName: null });
  });
});

async function setUpStand(number: number, gameName: string | null = `Juego ${number}`): Promise<{ visit: NewVisit }> {
  const stand = await createStand(number, gameName);

  staffId = (await createStandAccount(`staff${number}@ut.mx`, "stand_staff", stand.id)).id;

  return { visit: { standId: stand.id, scannedById: staffId, pin: PIN, ratings: RATINGS } };
}

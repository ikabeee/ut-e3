/**
 * @jest-environment node
 */
import { INITIAL_EVENT_SETTINGS, seedEventSettings } from "@features/event-settings/lib/server/event-settings-seed";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const EDITED_ITCH_OPENS_AT = new Date("2026-11-20T21:00:00.000Z");

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("INITIAL_EVENT_SETTINGS", () => {
  it("opens the event at 12:00 and closes it at 18:30 Cancun", () => {
    expect(INITIAL_EVENT_SETTINGS.eventStartsAt).toBe("2026-11-20T17:00:00.000Z");
    expect(INITIAL_EVENT_SETTINGS.eventEndsAt).toBe("2026-11-20T23:30:00.000Z");
  });

  it("opens the KOF pre-list on 13 Nov 2026 at 00:00 Cancun", () => {
    expect(INITIAL_EVENT_SETTINGS.kofRegistrationOpensAt).toBe("2026-11-13T05:00:00.000Z");
  });

  it("checks in the pre-listed KOF players from 12:00 to 12:45 Cancun on the event day", () => {
    expect(INITIAL_EVENT_SETTINGS.kofCheckInStartsAt).toBe("2026-11-20T17:00:00.000Z");
    expect(INITIAL_EVENT_SETTINGS.kofCheckInEndsAt).toBe("2026-11-20T17:45:00.000Z");
  });

  it("signs up KOF players on site from 12:00 to 12:45 Cancun", () => {
    expect(INITIAL_EVENT_SETTINGS.kofOnsiteSignupStartsAt).toBe("2026-11-20T17:00:00.000Z");
    expect(INITIAL_EVENT_SETTINGS.kofOnsiteSignupEndsAt).toBe("2026-11-20T17:45:00.000Z");
  });

  it("generates the KOF bracket at 12:55 Cancun", () => {
    expect(INITIAL_EVENT_SETTINGS.kofBracketGeneratesAt).toBe("2026-11-20T17:55:00.000Z");
  });

  it("cuts off the check-ins at 16:50 Cancun, when the stands close", () => {
    expect(INITIAL_EVENT_SETTINGS.checkInCutoffAt).toBe("2026-11-20T21:50:00.000Z");
  });

  it("no longer has a KOF registration close", () => {
    expect(INITIAL_EVENT_SETTINGS).not.toHaveProperty("kofRegistrationClosesAt");
  });

  it("keeps the other settings", () => {
    expect(INITIAL_EVENT_SETTINGS).toMatchObject({
      registrationOpensAt: "2026-11-13T05:00:00.000Z",
      marketplaceClosesAt: "2026-11-11T04:59:00.000Z",
      marketplaceFormUrl: null,
      itchOpensAt: "2026-11-20T21:30:00.000Z",
      raffleStartsAt: "2026-11-20T23:00:00.000Z",
      publicBracketEnabled: true,
    });
  });
});

describe("seedEventSettings", () => {
  beforeEach(async () => {
    await getPrisma().eventSettings.deleteMany();
  });

  it("writes the initial settings as row 1 with the fraud thresholds 12, 10 and 1", async () => {
    await seedEventSettings(getPrisma());

    expect(await getPrisma().eventSettings.findMany()).toEqual([
      expect.objectContaining({
        id: 1,
        eventStartsAt: new Date(INITIAL_EVENT_SETTINGS.eventStartsAt),
        raffleStartsAt: new Date(INITIAL_EVENT_SETTINGS.raffleStartsAt),
        marketplaceFormUrl: null,
        publicBracketEnabled: true,
        fraudTopScoreCount: 12,
        fraudWindowMinutes: 10,
        fraudSingleVisitMax: 1,
      }),
    ]);
  });

  it("leaves the same row when it runs twice", async () => {
    await seedEventSettings(getPrisma());
    const firstRun = await getPrisma().eventSettings.findMany();

    await seedEventSettings(getPrisma());

    expect(await getPrisma().eventSettings.findMany()).toEqual(firstRun);
  });

  it("keeps a setting edited after the first run", async () => {
    await seedEventSettings(getPrisma());
    await getPrisma().eventSettings.update({ where: { id: 1 }, data: { itchOpensAt: EDITED_ITCH_OPENS_AT } });

    await seedEventSettings(getPrisma());

    const rows = await getPrisma().eventSettings.findMany();

    expect(rows).toHaveLength(1);
    expect(rows[0].itchOpensAt).toEqual(EDITED_ITCH_OPENS_AT);
  });
});

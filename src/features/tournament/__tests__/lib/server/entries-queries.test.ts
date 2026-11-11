/**
 * @jest-environment node
 */
import { getEntries, getEntrySchedule, getVisitorEntryStatus } from "@features/tournament/lib/server/entries-queries";
import { createEventSettings, createVisitors } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

let visitors: Awaited<ReturnType<typeof createVisitors>> = [];

beforeAll(async () => {
  visitors = await createVisitors(3);
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().tournamentEntry.deleteMany();
});

describe("getEntrySchedule", () => {
  it("explains that the event settings are missing", async () => {
    await expect(getEntrySchedule()).rejects.toThrow("horarios del evento");
  });

  it("reads the six hours of the tournament", async () => {
    await createEventSettings();

    expect(await getEntrySchedule()).toEqual({
      registrationOpensAt: new Date("2026-11-13T05:00:00.000Z"),
      checkInStartsAt: new Date("2026-11-20T17:00:00.000Z"),
      checkInEndsAt: new Date("2026-11-20T17:45:00.000Z"),
      onsiteStartsAt: new Date("2026-11-20T17:00:00.000Z"),
      onsiteEndsAt: new Date("2026-11-20T17:45:00.000Z"),
      bracketGeneratesAt: new Date("2026-11-20T17:55:00.000Z"),
    });
  });
});

describe("getEntries", () => {
  it("lists the entries in the order they were added, with the gamertag", async () => {
    await getPrisma().tournamentEntry.create({
      data: { visitorId: visitors[1].id, channel: "pre", status: "registered" },
    });
    await getPrisma().tournamentEntry.create({
      data: {
        visitorId: visitors[0].id,
        channel: "onsite",
        status: "checked_in",
        checkedInAt: new Date("2026-11-20T17:20:00.000Z"),
      },
    });

    const entries = await getEntries();

    expect(entries.map((entry) => [entry.gamertag, entry.channel, entry.status, entry.checkedInAt])).toEqual([
      ["Jugador2", "pre", "registered", null],
      ["Jugador1", "onsite", "checked_in", "2026-11-20T17:20:00.000Z"],
    ]);
  });
});

describe("getVisitorEntryStatus", () => {
  it("is null for a visitor that is not in the tournament", async () => {
    expect(await getVisitorEntryStatus(visitors[0].id)).toBeNull();
  });

  it("answers the status of the entry of that visitor only", async () => {
    await getPrisma().tournamentEntry.create({
      data: { visitorId: visitors[0].id, channel: "pre", status: "registered" },
    });

    expect(await getVisitorEntryStatus(visitors[0].id)).toBe("registered");
    expect(await getVisitorEntryStatus(visitors[2].id)).toBeNull();
  });
});

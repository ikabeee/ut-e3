/**
 * @jest-environment node
 */
import type { Prisma } from "@generated/prisma/client";
import { createTestClient, createTestDatabase } from "@shared/__tests__/lib/server/test-database";

type OrderedField = "eventStartsAt" | "kofCheckInStartsAt" | "kofOnsiteSignupStartsAt" | "checkInCutoffAt";

type LaterField = "eventEndsAt" | "kofCheckInEndsAt" | "kofOnsiteSignupEndsAt" | "raffleStartsAt";

type ThresholdField = "fraudTopScoreCount" | "fraudWindowMinutes" | "fraudSingleVisitMax";

const ORDERED_PAIRS: [OrderedField, LaterField][] = [
  ["eventStartsAt", "eventEndsAt"],
  ["kofCheckInStartsAt", "kofCheckInEndsAt"],
  ["kofOnsiteSignupStartsAt", "kofOnsiteSignupEndsAt"],
  ["checkInCutoffAt", "raffleStartsAt"],
];

const THRESHOLD_FIELDS: ThresholdField[] = ["fraudTopScoreCount", "fraudWindowMinutes", "fraudSingleVisitMax"];

const ONE_MINUTE_MS = 60_000;

const database = createTestDatabase();

const prisma = createTestClient(database);

afterAll(async () => {
  await prisma.$disconnect();
  database.remove();
});

beforeEach(async () => {
  await prisma.eventSettings.deleteMany();
});

describe("event_settings table", () => {
  it("keeps a single row with id 1", async () => {
    await createEventSettings({});

    await expect(createEventSettings({ id: 2 })).rejects.toThrow();
    expect(await prisma.eventSettings.findMany({ select: { id: true } })).toEqual([{ id: 1 }]);
  });

  it.each(ORDERED_PAIRS)("keeps %s strictly before %s", async (earlier, later) => {
    const settings = await createEventSettings({});

    await expect(updateEventSettings({ [earlier]: settings[later] })).rejects.toThrow();
    await expect(updateEventSettings({ [earlier]: minutesFrom(settings[later], 1) })).rejects.toThrow();
    expect(await readEventSettings()).toEqual(settings);

    await expect(updateEventSettings({ [earlier]: minutesFrom(settings[later], -1) })).resolves.toBeDefined();
  });

  it.each(THRESHOLD_FIELDS)("keeps %s greater than 0", async (field) => {
    const settings = await createEventSettings({});

    await expect(updateEventSettings({ [field]: 0 })).rejects.toThrow();
    await expect(updateEventSettings({ [field]: -1 })).rejects.toThrow();
    expect(await readEventSettings()).toEqual(settings);

    await expect(updateEventSettings({ [field]: 1 })).resolves.toMatchObject({ [field]: 1 });
  });
});

function createEventSettings(overrides: Partial<Prisma.EventSettingsCreateInput>) {
  return prisma.eventSettings.create({
    data: {
      // Explicit id: the column is AUTOINCREMENT, so after a delete the default would not be 1 again.
      id: 1,
      eventStartsAt: new Date("2026-11-20T17:00:00.000Z"),
      eventEndsAt: new Date("2026-11-20T23:30:00.000Z"),
      registrationOpensAt: new Date("2026-11-13T05:00:00.000Z"),
      kofRegistrationOpensAt: new Date("2026-11-13T05:00:00.000Z"),
      kofCheckInStartsAt: new Date("2026-11-20T17:00:00.000Z"),
      kofCheckInEndsAt: new Date("2026-11-20T17:45:00.000Z"),
      kofOnsiteSignupStartsAt: new Date("2026-11-20T17:00:00.000Z"),
      kofOnsiteSignupEndsAt: new Date("2026-11-20T17:45:00.000Z"),
      kofBracketGeneratesAt: new Date("2026-11-20T17:55:00.000Z"),
      marketplaceClosesAt: new Date("2026-11-11T04:59:00.000Z"),
      itchOpensAt: new Date("2026-11-20T21:30:00.000Z"),
      checkInCutoffAt: new Date("2026-11-20T21:50:00.000Z"),
      raffleStartsAt: new Date("2026-11-20T23:00:00.000Z"),
      publicBracketEnabled: true,
      ...overrides,
    },
  });
}

function updateEventSettings(data: Prisma.EventSettingsUpdateInput) {
  return prisma.eventSettings.update({ where: { id: 1 }, data });
}

function minutesFrom(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * ONE_MINUTE_MS);
}

function readEventSettings() {
  return prisma.eventSettings.findUniqueOrThrow({ where: { id: 1 } });
}

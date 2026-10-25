/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { sortScheduleItems } from "@features/schedule/lib/schedule-order";
import { getScheduleItems, SCHEDULE_CACHE_TAG } from "@features/schedule/lib/server/schedule-queries";
import { INITIAL_SCHEDULE_ITEMS, seedScheduleItems } from "@features/schedule/lib/server/schedule-seed";
import type { ScheduleItem } from "@features/schedule/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// cacheLife and cacheTag only run inside Next; the spies replace them on the module object the query reads.
const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const cacheLife = jest.spyOn(nextCache, "cacheLife").mockImplementation(() => undefined);

const cacheTag = jest.spyOn(nextCache, "cacheTag").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().scheduleItem.deleteMany();
});

describe("getScheduleItems", () => {
  it("returns the seeded program in start order, with UUID ids", async () => {
    await seedScheduleItems(getPrisma());

    expect(await getScheduleItems()).toEqual(sortScheduleItems(INITIAL_SCHEDULE_ITEMS).map(withUuid));
  });

  it("opens the program with the opening ceremony at 12:00 Cancun as a Z instant", async () => {
    await seedScheduleItems(getPrisma());

    const [opening] = await getScheduleItems();

    expect(opening).toEqual({
      id: expect.stringMatching(UUID),
      title: "Inauguración en el escenario principal",
      description: "Bienvenida, palabras de la coordinación general y mensaje del Rector.",
      startsAt: "2026-11-20T17:00:00.000Z",
      endsAt: "2026-11-20T17:30:00.000Z",
      zone: "stage",
    });
  });

  it("returns an empty list when there are no activities", async () => {
    expect(await getScheduleItems()).toEqual([]);
  });

  it("caches the program for hours under the schedule tag", async () => {
    await getScheduleItems();

    expect(cacheLife).toHaveBeenCalledWith("hours");
    expect(cacheTag).toHaveBeenCalledWith(SCHEDULE_CACHE_TAG);
  });
});

function withUuid(item: ScheduleItem) {
  return { ...item, id: expect.stringMatching(UUID) };
}

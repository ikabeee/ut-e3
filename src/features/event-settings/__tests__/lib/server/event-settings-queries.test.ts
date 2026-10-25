/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { EVENT_SETTINGS_CACHE_TAG, getEventSettings } from "@features/event-settings/lib/server/event-settings-queries";
import { INITIAL_EVENT_SETTINGS, seedEventSettings } from "@features/event-settings/lib/server/event-settings-seed";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

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
  await getPrisma().eventSettings.deleteMany();
});

describe("getEventSettings", () => {
  it("returns the seeded settings with their ISO 8601 UTC instants", async () => {
    await seedEventSettings(getPrisma());

    const settings = await getEventSettings();

    expect(settings).toEqual(INITIAL_EVENT_SETTINGS);
    expect(settings).toMatchObject({ eventStartsAt: "2026-11-20T17:00:00.000Z", marketplaceFormUrl: null });
  });

  it("asks to run the seed when the settings row is missing", async () => {
    const reading = getEventSettings();

    await expect(reading).rejects.toThrow(/event_settings/);
    await expect(reading).rejects.toThrow(/npm run db:seed/);
  });

  it("caches the settings for hours under the event-settings tag", async () => {
    await seedEventSettings(getPrisma());

    await getEventSettings();

    expect(cacheLife).toHaveBeenCalledWith("hours");
    expect(cacheTag).toHaveBeenCalledWith(EVENT_SETTINGS_CACHE_TAG);
  });
});

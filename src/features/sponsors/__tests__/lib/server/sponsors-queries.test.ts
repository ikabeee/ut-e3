/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { NORTH_BYTE, PIXEL_FORGE } from "@features/sponsors/__tests__/components/sponsor-test-data";
import { getSponsors, SPONSORS_CACHE_TAG } from "@features/sponsors/lib/server/sponsors-queries";
import { INITIAL_SPONSORS, seedSponsors } from "@features/sponsors/lib/server/sponsors-seed";
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
  await getPrisma().sponsor.deleteMany();
});

describe("getSponsors", () => {
  it("returns the seeded sponsors, which are none for now", async () => {
    await seedSponsors(getPrisma());

    expect(await getSponsors()).toEqual(INITIAL_SPONSORS);
  });

  it("returns an empty list when there are no sponsors", async () => {
    expect(await getSponsors()).toEqual([]);
  });

  it("returns the sponsors ordered by position", async () => {
    await getPrisma().sponsor.create({ data: NORTH_BYTE });
    await getPrisma().sponsor.create({ data: PIXEL_FORGE });

    expect(await getSponsors()).toEqual([PIXEL_FORGE, NORTH_BYTE]);
  });

  it("caches the sponsors for hours under the sponsors tag", async () => {
    await getSponsors();

    expect(cacheLife).toHaveBeenCalledWith("hours");
    expect(cacheTag).toHaveBeenCalledWith(SPONSORS_CACHE_TAG);
  });
});

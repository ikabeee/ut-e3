/**
 * @jest-environment node
 */
import { PIXEL_FORGE } from "@features/sponsors/__tests__/components/sponsor-test-data";
import { INITIAL_SPONSORS, seedSponsors } from "@features/sponsors/lib/server/sponsors-seed";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().sponsor.deleteMany();
});

describe("seedSponsors", () => {
  it("writes the initial sponsors, which are none for now", async () => {
    await seedSponsors(getPrisma());

    expect(await getPrisma().sponsor.count()).toBe(INITIAL_SPONSORS.length);
  });

  it("leaves the same rows when it runs twice", async () => {
    await seedSponsors(getPrisma());
    const firstRun = await readSponsors();

    await seedSponsors(getPrisma());

    expect(await readSponsors()).toEqual(firstRun);
  });

  it("keeps a sponsor that already exists", async () => {
    const existing = await getPrisma().sponsor.create({ data: PIXEL_FORGE });

    await seedSponsors(getPrisma());

    expect(await readSponsors()).toEqual([existing]);
  });
});

function readSponsors() {
  return getPrisma().sponsor.findMany({ orderBy: { id: "asc" } });
}

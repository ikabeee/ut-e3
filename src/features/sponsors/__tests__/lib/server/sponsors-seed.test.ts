/**
 * @jest-environment node
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
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

const MEXICAN_E164 = /^\+52\d{10}$/;

describe("INITIAL_SPONSORS", () => {
  it("has example sponsors until the real ones are confirmed", () => {
    expect(INITIAL_SPONSORS.length).toBeGreaterThan(0);
  });

  it("gives every example sponsor a logo in public/, an https site and a +52 phone", () => {
    for (const sponsor of INITIAL_SPONSORS) {
      expect(existsSync(join(process.cwd(), "public", sponsor.logoPath))).toBe(true);
      expect(sponsor.websiteUrl).toMatch(/^https:\/\//);
      expect(sponsor.phone).toMatch(MEXICAN_E164);
    }
  });

  it("numbers the positions 1, 2, 3... in order", () => {
    expect(INITIAL_SPONSORS.map((sponsor) => sponsor.position)).toEqual(INITIAL_SPONSORS.map((_, index) => index + 1));
  });
});

describe("seedSponsors", () => {
  it("writes every initial sponsor", async () => {
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

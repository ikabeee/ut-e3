/**
 * @jest-environment node
 */
import { PIXEL_FORGE } from "@features/sponsors/__tests__/components/sponsor-test-data";
import { backfillSponsors } from "@features/sponsors/lib/server/sponsors-backfill";
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

const BONAVIDA = INITIAL_SPONSORS[1];
const NEW_SPONSOR_NAMES = INITIAL_SPONSORS.slice(8).map(({ name }) => name);

describe("backfillSponsors", () => {
  it("inserts every initial sponsor into an empty table, in order", async () => {
    const result = await backfillSponsors(getPrisma());

    expect(result.added).toEqual(INITIAL_SPONSORS.map(({ name }) => name));
    expect(result.filled).toEqual([]);
    expect(await readSponsors()).toEqual(
      INITIAL_SPONSORS.map(({ id: _id, ...sponsor }) => expect.objectContaining(sponsor)),
    );
  });

  it("adds only the sponsors that are missing, after the last position, and leaves the existing rows as they are", async () => {
    await seedSponsors(getPrisma());
    await getPrisma().sponsor.deleteMany({ where: { name: { in: NEW_SPONSOR_NAMES } } });
    const before = await readSponsors();

    const result = await backfillSponsors(getPrisma());

    expect(result).toEqual({ added: NEW_SPONSOR_NAMES, filled: [] });
    const rows = await readSponsors();
    expect(rows.slice(0, before.length)).toEqual(before);
    expect(rows.map(({ position }) => position)).toEqual(INITIAL_SPONSORS.map(({ position }) => position));
  });

  it("puts a new sponsor after the last position when the sysadmin already added others", async () => {
    await seedSponsors(getPrisma());
    await getPrisma().sponsor.deleteMany({ where: { name: "Target G" } });
    await getPrisma().sponsor.create({ data: { ...PIXEL_FORGE, id: undefined, position: 40 } });

    await backfillSponsors(getPrisma());

    const target = await getPrisma().sponsor.findFirstOrThrow({ where: { name: "Target G" } });
    expect(target.position).toBe(41);
  });

  it("fills the empty fields of an existing sponsor, matching its name without regard to case", async () => {
    await getPrisma().sponsor.create({
      data: {
        name: "bonavida",
        logoPath: BONAVIDA.logoPath,
        websiteUrl: "",
        phone: "",
        email: null,
        services: "",
        position: 2,
      },
    });

    const result = await backfillSponsors(getPrisma());

    expect(result.filled).toEqual(["bonavida (websiteUrl, phone, email, services)"]);
    expect(result.added).not.toContain("Bonavida");
    const row = await getPrisma().sponsor.findFirstOrThrow({ where: { name: "bonavida" } });
    expect(row).toMatchObject({
      websiteUrl: BONAVIDA.websiteUrl,
      phone: BONAVIDA.phone,
      email: BONAVIDA.email,
      services: BONAVIDA.services,
      logoPath: BONAVIDA.logoPath,
      position: 2,
    });
    expect(await getPrisma().sponsor.count({ where: { name: { in: ["Bonavida", "bonavida"] } } })).toBe(1);
  });

  it("never overwrites a value the sysadmin edited, and fills only what is empty", async () => {
    await getPrisma().sponsor.create({
      data: {
        name: "Bonavida",
        logoPath: "/sponsors/custom.png",
        websiteUrl: "https://custom.example",
        phone: "+529990000000",
        email: "owner@custom.example",
        services: "",
        position: 77,
      },
    });

    const result = await backfillSponsors(getPrisma());

    expect(result.filled).toEqual(["Bonavida (services)"]);
    const row = await getPrisma().sponsor.findFirstOrThrow({ where: { name: "Bonavida" } });
    expect(row).toMatchObject({
      logoPath: "/sponsors/custom.png",
      websiteUrl: "https://custom.example",
      phone: "+529990000000",
      email: "owner@custom.example",
      services: BONAVIDA.services,
      position: 77,
    });
  });

  it("does not fill a field that the initial data leaves empty", async () => {
    await getPrisma().sponsor.create({
      data: {
        name: "Target G",
        logoPath: "/sponsors/target-g.png",
        websiteUrl: "",
        phone: "",
        email: null,
        services: "",
        position: 5,
      },
    });

    await backfillSponsors(getPrisma());

    const row = await getPrisma().sponsor.findFirstOrThrow({ where: { name: "Target G" } });
    expect(row).toMatchObject({ websiteUrl: "", phone: "", email: null });
  });

  it("changes nothing the second time it runs", async () => {
    await backfillSponsors(getPrisma());
    const firstRun = await readSponsors();

    const result = await backfillSponsors(getPrisma());

    expect(result).toEqual({ added: [], filled: [] });
    expect(await readSponsors()).toEqual(firstRun);
  });

  it("rejects an invalid entry before writing anything", async () => {
    const invalid = [{ ...INITIAL_SPONSORS[0], phone: "998 000" }];

    await expect(backfillSponsors(getPrisma(), invalid)).rejects.toThrow("Algorix Insights");
    expect(await getPrisma().sponsor.count()).toBe(0);
  });

  it("rejects an entry whose logo file does not exist in public/", async () => {
    const missing = [{ ...INITIAL_SPONSORS[0], logoPath: "/sponsors/does-not-exist.svg" }];

    await expect(backfillSponsors(getPrisma(), missing)).rejects.toThrow("does-not-exist.svg");
    expect(await getPrisma().sponsor.count()).toBe(0);
  });
});

function readSponsors() {
  return getPrisma().sponsor.findMany({ orderBy: { position: "asc" } });
}

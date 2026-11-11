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

const E164 = /^\+\d{8,15}$/;

describe("INITIAL_SPONSORS", () => {
  it("lists the six sponsors with a logo, in the order of the carousel", () => {
    expect(INITIAL_SPONSORS.map((sponsor) => sponsor.name)).toEqual([
      "Algorix Insights",
      "Bonavida",
      "Mermelada",
      "Nemo Submarine",
      "OpSET",
      "Le Jardin d'Aurore",
    ]);
  });

  it("gives every sponsor a logo that exists in public/", () => {
    for (const sponsor of INITIAL_SPONSORS) {
      expect(existsSync(join(process.cwd(), "public", sponsor.logoPath))).toBe(true);
    }
  });

  it("keeps the website and the phone only where the sources give them", () => {
    expect(INITIAL_SPONSORS.map(({ name, websiteUrl, phone }) => ({ name, websiteUrl, phone }))).toEqual([
      { name: "Algorix Insights", websiteUrl: "https://algorixinsights.com", phone: "" },
      { name: "Bonavida", websiteUrl: "https://aguabonavida.com.mx/", phone: "+529983048120" },
      { name: "Mermelada", websiteUrl: "", phone: "" },
      { name: "Nemo Submarine", websiteUrl: "https://www.nemoisla.com/", phone: "+19038019083" },
      { name: "OpSET", websiteUrl: "", phone: "" },
      { name: "Le Jardin d'Aurore", websiteUrl: "", phone: "" },
    ]);
  });

  it("describes only Algorix Insights, the only sponsor with a services text", () => {
    expect(INITIAL_SPONSORS.map((sponsor) => sponsor.services)).toEqual([
      "Desarrollo web, agentes de IA y software a medida.",
      "",
      "",
      "",
      "",
      "",
    ]);
  });

  it("writes every phone that exists in E.164", () => {
    for (const { phone } of INITIAL_SPONSORS.filter((sponsor) => sponsor.phone !== "")) {
      expect(phone).toMatch(E164);
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

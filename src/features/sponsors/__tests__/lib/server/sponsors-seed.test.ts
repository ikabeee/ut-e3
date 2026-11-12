/**
 * @jest-environment node
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PIXEL_FORGE } from "@features/sponsors/__tests__/components/sponsor-test-data";
import { parseSponsorInput } from "@features/sponsors/lib/sponsor-input";
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
  it("lists the eight sponsors with a logo, in the order of the carousel", () => {
    expect(INITIAL_SPONSORS.map((sponsor) => sponsor.name)).toEqual([
      "Algorix Insights",
      "Bonavida",
      "Mermelada",
      "Nemo Submarine",
      "OpSET",
      "Le Jardin d'Aurore",
      "Noxy Digital",
      "Directrix Studio",
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
      { name: "OpSET", websiteUrl: "", phone: "+529981878194" },
      { name: "Le Jardin d'Aurore", websiteUrl: "https://www.lejardindaurore.com/", phone: "+529981878194" },
      { name: "Noxy Digital", websiteUrl: "https://www.noxy.digital/", phone: "+529981725547" },
      {
        name: "Directrix Studio",
        websiteUrl: "https://www.facebook.com/GrupoDirectrixAgenciaCreativa/",
        phone: "+529981268631",
      },
    ]);
  });

  it("gives an email only to OpSET, Le Jardin d'Aurore, Noxy Digital and Directrix Studio, and stores the others as null", () => {
    expect(INITIAL_SPONSORS.map(({ name, email }) => ({ name, email }))).toEqual([
      { name: "Algorix Insights", email: null },
      { name: "Bonavida", email: null },
      { name: "Mermelada", email: null },
      { name: "Nemo Submarine", email: null },
      { name: "OpSET", email: "ceo@opset.com.mx" },
      { name: "Le Jardin d'Aurore", email: "contacto@lejardindaurore.com" },
      { name: "Noxy Digital", email: "info@noxy.digital" },
      { name: "Directrix Studio", email: "directrixstudio@gmail.com" },
    ]);
  });

  it("keeps the website and the services of OpSET, and the services of Le Jardin d'Aurore, empty", () => {
    const [opset, jardin] = INITIAL_SPONSORS.slice(4);

    expect([opset.websiteUrl, opset.services, jardin.services]).toEqual(["", "", ""]);
  });

  it.each([
    ["Le Jardin d'Aurore", "https://www.lejardindaurore.com/", "+529981878194"],
    ["Noxy Digital", "https://www.noxy.digital/", "+529981725547"],
    ["Directrix Studio", "https://www.facebook.com/GrupoDirectrixAgenciaCreativa/", "+529981268631"],
  ])("gives %s data that the admin validation accepts (https, E.164, email)", (name, websiteUrl, phone) => {
    const sponsor = INITIAL_SPONSORS.find((candidate) => candidate.name === name);
    const form = new FormData();

    for (const [field, value] of Object.entries({ ...sponsor, position: String(sponsor?.position) }))
      form.set(field, value === null ? "" : String(value));

    expect(parseSponsorInput(form)).toMatchObject({ isValid: true, sponsor: { websiteUrl, phone } });
  });

  it("describes only Algorix Insights, the only sponsor with a services text", () => {
    expect(INITIAL_SPONSORS.map((sponsor) => sponsor.services)).toEqual([
      "Desarrollo web, agentes de IA y software a medida.",
      "",
      "",
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

  it("writes the emails and the OpSET phone to the table, and null where there is no email", async () => {
    await seedSponsors(getPrisma());

    const rows = await getPrisma().sponsor.findMany({
      orderBy: { position: "asc" },
      select: { name: true, email: true, phone: true },
    });

    expect(rows.map(({ email }) => email)).toEqual([
      null,
      null,
      null,
      null,
      "ceo@opset.com.mx",
      "contacto@lejardindaurore.com",
      "info@noxy.digital",
      "directrixstudio@gmail.com",
    ]);
    expect(rows[4]?.phone).toBe("+529981878194");
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

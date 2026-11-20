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

const NAMES = [
  "Algorix Insights",
  "Bonavida",
  "Mermelada",
  "Nemo Submarine",
  "OpSET",
  "Le Jardin d'Aurore",
  "Noxy Digital",
  "Directrix Studio",
  "Dolphin Discovery",
  "Fresh Air",
  "Pixel & Code",
  "Rock and Race",
  "Target G",
];

describe("INITIAL_SPONSORS", () => {
  it("lists the thirteen sponsors, the eight first ones in their order and the new ones after, alphabetically", () => {
    expect(INITIAL_SPONSORS.map((sponsor) => sponsor.name)).toEqual(NAMES);
  });

  it("gives every sponsor a logo that exists in public/", () => {
    for (const sponsor of INITIAL_SPONSORS) {
      expect(existsSync(join(process.cwd(), "public", sponsor.logoPath))).toBe(true);
    }
  });

  it("keeps the website and the phone where the sources give them, and empty where no source does", () => {
    expect(INITIAL_SPONSORS.map(({ name, websiteUrl, phone }) => ({ name, websiteUrl, phone }))).toEqual([
      { name: "Algorix Insights", websiteUrl: "https://algorixinsights.com", phone: "" },
      { name: "Bonavida", websiteUrl: "https://aguabonavida.com.mx", phone: "+529983048120" },
      { name: "Mermelada", websiteUrl: "https://mermeladacocinaquereconforta.com", phone: "+529981819937" },
      { name: "Nemo Submarine", websiteUrl: "https://www.nemoisla.com/", phone: "+19038019083" },
      { name: "OpSET", websiteUrl: "https://opset.com.mx", phone: "+529981878194" },
      { name: "Le Jardin d'Aurore", websiteUrl: "https://lejardindaurore.com", phone: "+529981878194" },
      { name: "Noxy Digital", websiteUrl: "https://www.noxy.digital/", phone: "+529981725547" },
      {
        name: "Directrix Studio",
        websiteUrl: "https://www.facebook.com/GrupoDirectrixAgenciaCreativa/",
        phone: "+529981268631",
      },
      { name: "Dolphin Discovery", websiteUrl: "https://www.dolphindiscovery.com.mx/", phone: "+529981933360" },
      { name: "Fresh Air", websiteUrl: "https://freshair.com.mx/", phone: "+529981802252" },
      { name: "Pixel & Code", websiteUrl: "https://pixelandcode.org", phone: "+529988941923" },
      { name: "Rock and Race", websiteUrl: "https://www.rockandrace.com", phone: "+529982893135" },
      { name: "Target G", websiteUrl: "", phone: "" },
    ]);
  });

  it("gives an email to the sponsors that have one and stores the others as null", () => {
    expect(INITIAL_SPONSORS.map(({ name, email }) => ({ name, email }))).toEqual([
      { name: "Algorix Insights", email: null },
      { name: "Bonavida", email: "ventas@aguabonavida.com.mx" },
      { name: "Mermelada", email: "mermeladacancun@gmail.com" },
      { name: "Nemo Submarine", email: null },
      { name: "OpSET", email: "ceo@opset.com.mx" },
      { name: "Le Jardin d'Aurore", email: "contacto@lejardindaurore.com" },
      { name: "Noxy Digital", email: "info@noxy.digital" },
      { name: "Directrix Studio", email: "directrixstudio@gmail.com" },
      { name: "Dolphin Discovery", email: "customercare@dolphindiscovery.com" },
      { name: "Fresh Air", email: null },
      { name: "Pixel & Code", email: null },
      { name: "Rock and Race", email: "info@rockandrace.com" },
      { name: "Target G", email: null },
    ]);
  });

  it("describes every sponsor but Directrix Studio with one short Spanish sentence", () => {
    expect(INITIAL_SPONSORS.map(({ name, services }) => ({ name, services }))).toEqual([
      {
        name: "Algorix Insights",
        services: "Desarrollo de software a la medida, sitios web y agentes de IA para automatizar negocios.",
      },
      { name: "Bonavida", services: "Agua purificada a domicilio en Cancún." },
      {
        name: "Mermelada",
        services: "Restaurante de desayunos y comida con recetas inspiradas en sabores regionales en Cancún.",
      },
      { name: "Nemo Submarine", services: "Paseos en submarino para ver arrecifes y vida marina en Isla Mujeres." },
      {
        name: "OpSET",
        services: "Desarrollo de sitios web, tiendas en línea, plataformas a la medida y branding en Cancún.",
      },
      {
        name: "Le Jardin d'Aurore",
        services: "Boutique floral que crea pequeños jardines botánicos y arreglos de plantas para el hogar.",
      },
      {
        name: "Noxy Digital",
        services: "Estudio de diseño y desarrollo de sitios web, tiendas en línea y plataformas.",
      },
      { name: "Directrix Studio", services: "" },
      {
        name: "Dolphin Discovery",
        services: "Programas de nado e interacción con delfines en Cancún, Isla Mujeres y la Riviera Maya.",
      },
      {
        name: "Fresh Air",
        services: "Renta de coolers evaporativos y climas portátiles para eventos en Cancún y la Riviera Maya.",
      },
      { name: "Pixel & Code", services: "Portales inmobiliarios y sitios web para captar clientes en Cancún." },
      { name: "Rock and Race", services: "Pista de arrancones en autos clásicos en Go Grand Outlet Cancún." },
      {
        name: "Target G",
        services: "Campo de tiro recreativo con lanzadores no letales en Go Grand Outlet Cancún.",
      },
    ]);
  });

  it("gives every sponsor data that the admin validation accepts", () => {
    for (const sponsor of INITIAL_SPONSORS) {
      const form = new FormData();

      for (const [field, value] of Object.entries({ ...sponsor, position: String(sponsor.position) }))
        form.set(field, value === null ? "" : String(value));

      expect(parseSponsorInput(form)).toMatchObject({ isValid: true });
    }
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

    expect(rows.map(({ email }) => email)).toEqual(INITIAL_SPONSORS.map(({ email }) => email));
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

/**
 * @jest-environment node
 */
import {
  DEMO_DEFAULT_PASSWORD,
  findProductionSigns,
  formatDemoTable,
  seedDemo,
} from "@features/admin/lib/server/demo-seed";
import { getPrisma } from "@shared/lib/server/prisma";
import { verifyPassword } from "@shared/lib/server/password";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

// Hashing 20 passwords can pass the default timeout when the machine is busy.
jest.setTimeout(60_000);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

// After the start of the event and before the hour of the bracket, the registration and the raffle.
const NOW = new Date("2026-11-20T17:50:00.000Z");

// Hours of the event, all after NOW: the demo must leave every one of them where it is.
const HOURS = {
  eventStartsAt: new Date("2026-11-20T17:00:00.000Z"),
  eventEndsAt: new Date("2026-11-20T23:30:00.000Z"),
  registrationOpensAt: new Date("2026-11-20T18:00:00.000Z"),
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
};

beforeAll(createStands);

// The accounts and the passports stay between tests (the audit log keeps a reference to them): the seed is idempotent.
beforeEach(async () => {
  await getPrisma().eventSettings.deleteMany();
  await getPrisma().eventSettings.create({ data: { id: 1, ...HOURS, publicBracketEnabled: true } });
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("seedDemo", () => {
  it.each([
    [{ NODE_ENV: "production" }, "NODE_ENV=production"],
    [{ SITE_MODE: "landing" }, "SITE_MODE=landing"],
    [{ DATABASE_URL: "file:/data/app.db" }, "/data/app.db"],
    [{ VERCEL_ENV: "production" }, "producción"],
  ])("refuses to run when the environment is %p, and creates nothing", async (env, sign) => {
    await expect(seedDemo(env, NOW, { openRaffle: false })).rejects.toThrow(sign);
    await expect(getPrisma().account.count({ where: { email: { endsWith: "@ejemplo.com" } } })).resolves.toBe(0);
  });

  it("accepts a development machine and the full mode", async () => {
    expect(findProductionSigns({ NODE_ENV: "development", SITE_MODE: "full", DATABASE_URL: "file:./dev.db" })).toEqual(
      [],
    );
    expect(findProductionSigns({})).toEqual([]);
  });

  it("creates the accounts of every flow with one password and does not move any hour", async () => {
    const result = await seedDemo({ DEMO_PASSWORD: "demo-password-uno" }, NOW, { openRaffle: false });
    const roles = new Set(result.accounts.map((account) => account.role));

    expect(roles).toEqual(
      new Set(["stand_staff", "stand_admin", "kof_admin", "kof_staff", "help_desk", "raffle_admin"]),
    );
    expect(result.accounts).toHaveLength(2 + 1 + 3 + 1 + 2);
    expect(result.accounts.every((account) => account.status === "active")).toBe(true);
    expect(result.raffleOpened).toBe(false);

    for (const email of result.accounts.map((account) => account.email)) {
      const account = await getPrisma().account.findUniqueOrThrow({ where: { email } });

      expect(await verifyPassword("demo-password-uno", account.password ?? "")).toBe(true);
    }

    const settings = await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } });

    expect({
      ...settings,
      id: undefined,
      publicBracketEnabled: undefined,
      marketplaceFormUrl: undefined,
    }).toMatchObject(HOURS);
    expect(result.bracket).toBe("notYet");
    await expect(getPrisma().kofTournament.count()).resolves.toBe(0);
  });

  it("uses the default password when DEMO_PASSWORD is blank", async () => {
    const result = await seedDemo({ DEMO_PASSWORD: "  " }, NOW, { openRaffle: false });

    expect(result.password).toBe(DEMO_DEFAULT_PASSWORD);
  });

  it("gives an account that already existed with another password the shared one, without creating it twice", async () => {
    await seedDemo({ DEMO_PASSWORD: "demo-password-primera" }, NOW, { openRaffle: false });

    const second = await seedDemo({ DEMO_PASSWORD: "demo-password-segunda" }, NOW, { openRaffle: false });
    const kof = await getPrisma().account.findUniqueOrThrow({ where: { email: "kof-admin@ejemplo.com" } });

    expect(await verifyPassword("demo-password-segunda", kof.password ?? "")).toBe(true);
    expect(second.accounts).toHaveLength(9);
    await expect(getPrisma().account.count({ where: { email: "kof-admin@ejemplo.com" } })).resolves.toBe(1);
  });

  it("moves only the raffle hour, and only with openRaffle", async () => {
    const result = await seedDemo({}, NOW, { openRaffle: true });
    const settings = await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } });

    expect(result.raffleOpened).toBe(true);
    expect(settings.raffleStartsAt).toEqual(NOW);
    expect(settings.checkInCutoffAt.getTime()).toBeLessThan(NOW.getTime());
    expect(settings.registrationOpensAt).toEqual(HOURS.registrationOpensAt);
    expect(settings.kofBracketGeneratesAt).toEqual(HOURS.kofBracketGeneratesAt);
    expect(settings.eventStartsAt).toEqual(HOURS.eventStartsAt);
  });
});

describe("formatDemoTable", () => {
  it("lists the email, the role, the password and the status of every account", async () => {
    const result = await seedDemo({ DEMO_PASSWORD: "demo-password-uno" }, NOW, { openRaffle: false });
    const lines = formatDemoTable(result).split("\n");

    expect(lines[0]).toMatch(/^Correo\s+Rol\s+Contraseña\s+Estado$/);
    expect(lines).toHaveLength(result.accounts.length + 1);
    expect(lines.slice(1).every((line) => line.includes("demo-password-uno"))).toBe(true);
    expect(lines.some((line) => /^help-desk@ejemplo\.com\s+help_desk\s/.test(line))).toBe(true);
    expect(lines.some((line) => /^rifa-1@ejemplo\.com\s+raffle_admin\s/.test(line))).toBe(true);
  });
});

async function createStands(): Promise<void> {
  const genre = await getPrisma().genre.upsert({
    where: { slug: "accion" },
    update: {},
    create: { name: "Acción", slug: "accion" },
  });

  for (const number of [1, 2]) {
    const stand = await getPrisma().stand.create({ data: { zone: "A", number, studio: 1, groupCode: "101" } });

    await getPrisma().game.create({
      data: {
        standId: stand.id,
        name: `Juego ${number}`,
        slug: `juego-${number}`,
        synopsis: "Prueba.",
        genreId: genre.id,
      },
    });
  }
}

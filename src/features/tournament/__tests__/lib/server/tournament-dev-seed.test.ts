/**
 * @jest-environment node
 */
import {
  KOF_DEV_ACCOUNTS,
  KOF_DEV_DEFAULT_PASSWORD,
  KOF_DEV_PLAYER_COUNT,
  seedKofDev,
} from "@features/tournament/lib/server/tournament-dev-seed";
import { getTournament } from "@features/tournament/lib/server/tournament-queries";
import { createEventSettings } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { verifyPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

// 28 October, a few weeks before the bracket hour of the event.
const NOW = new Date("2026-10-28T18:00:00.000Z");

const EVENT_DAY_BRACKET_HOUR = new Date("2026-11-20T17:55:00.000Z");

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// The accounts that get an audit entry cannot be deleted, so the tests run in order and build on each other.
describe("seedKofDev", () => {
  it("refuses to run in production and creates nothing", async () => {
    await expect(seedKofDev({ NODE_ENV: "production" }, NOW)).rejects.toThrow("producción");
    expect(await getPrisma().account.count()).toBe(0);
  });

  it("asks for the event settings first and creates nothing without them", async () => {
    await expect(seedKofDev({}, NOW)).rejects.toThrow("npm run db:seed");
    expect(await getPrisma().account.count()).toBe(0);
  });

  it("creates the three KOF accounts, moves the bracket hour and generates a bracket with byes", async () => {
    await createEventSettings();

    const result = await seedKofDev({}, NOW);
    const accounts = await getPrisma().account.findMany({ orderBy: { email: "asc" } });
    const settings = await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } });
    const tournament = await getTournament();

    expect(result.createdAccounts).toEqual(KOF_DEV_ACCOUNTS.map((account) => account.email).toSorted());
    expect(accounts.map((account) => [account.email, account.role, account.kofDesk, account.status])).toEqual([
      ["kof-admin@ejemplo.com", "kof_admin", null, "active"],
      ["kof-mesa1@ejemplo.com", "kof_staff", 1, "active"],
      ["kof-mesa2@ejemplo.com", "kof_staff", 2, "active"],
    ]);
    expect(await verifyPassword(KOF_DEV_DEFAULT_PASSWORD, accounts[0].password ?? "")).toBe(true);
    expect(settings.kofBracketGeneratesAt.getTime()).toBe(NOW.getTime());
    expect(result.bracket).toBe("created");
    expect(tournament?.players).toHaveLength(KOF_DEV_PLAYER_COUNT);
    expect(tournament?.matches.filter((match) => match.outcome === "bye")).toHaveLength(24);
    expect(EVENT_DAY_BRACKET_HOUR.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it("can run again: it only creates the missing account and does not regenerate the bracket", async () => {
    const later = new Date(NOW.getTime() + 60 * 60 * 1000);
    const admin = await getPrisma().account.findFirstOrThrow({ where: { email: "kof-admin@ejemplo.com" } });

    await getPrisma().account.deleteMany({ where: { email: "kof-mesa2@ejemplo.com" } });

    const result = await seedKofDev({ KOF_DEV_PASSWORD: "another password" }, later);
    const adminAfter = await getPrisma().account.findFirstOrThrow({ where: { email: "kof-admin@ejemplo.com" } });
    const recreated = await getPrisma().account.findFirstOrThrow({ where: { email: "kof-mesa2@ejemplo.com" } });
    const settings = await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } });

    expect(result).toEqual({ createdAccounts: ["kof-mesa2@ejemplo.com"], bracket: "alreadyGenerated" });
    expect(adminAfter.password).toBe(admin.password);
    expect(await verifyPassword("another password", recreated.password ?? "")).toBe(true);
    expect(recreated.kofDesk).toBe(2);
    expect(await getPrisma().kofTournament.count()).toBe(1);
    expect(settings.kofBracketGeneratesAt.getTime()).toBe(NOW.getTime());
  });
});

/**
 * @jest-environment node
 */
import { RAFFLE_DEV_ACCOUNTS, seedRaffleDev } from "@features/raffle/lib/server/raffle-dev-seed";
import { createEventSettings, RAFFLE_STARTS_AT } from "@features/raffle/__tests__/lib/server/raffle-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

// Earlier than the seeded cutoff of check-ins (16:50), so the cutoff has to move too.
const NOW = new Date("2026-11-20T20:00:00.000Z");

beforeAll(createEventSettings);

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("seedRaffleDev", () => {
  it("refuses to run in production", async () => {
    await expect(seedRaffleDev({ NODE_ENV: "production" }, NOW)).rejects.toThrow(/producción/);
    expect(await getPrisma().account.count()).toBe(0);
  });

  it("creates the two raffle administrators, 30 passports with 40 tickets, and opens the raffle now", async () => {
    const result = await seedRaffleDev({}, NOW);
    const settings = await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } });

    expect(result).toEqual({
      createdAccounts: RAFFLE_DEV_ACCOUNTS.map((account) => account.email),
      createdVisitors: 30,
      createdTickets: 40,
    });
    expect(await getPrisma().account.count({ where: { role: "raffle_admin", status: "active" } })).toBe(2);
    expect(settings.raffleStartsAt).toEqual(NOW);
    expect(settings.checkInCutoffAt.getTime()).toBeLessThan(NOW.getTime());
  });

  it("adds nothing when it runs again, and leaves an hour that already passed alone", async () => {
    const result = await seedRaffleDev({}, new Date(RAFFLE_STARTS_AT.getTime() + 60_000));

    expect(result).toEqual({ createdAccounts: [], createdVisitors: 0, createdTickets: 0 });
    expect((await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } })).raffleStartsAt).toEqual(NOW);
  });
});

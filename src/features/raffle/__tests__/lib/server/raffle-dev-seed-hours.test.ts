/**
 * @jest-environment node
 */
import { seedRaffleDev } from "@features/raffle/lib/server/raffle-dev-seed";
import { createEventSettings } from "@features/raffle/__tests__/lib/server/raffle-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

// Earlier than the seeded start of the raffle, so a seed that moves hours would move it.
const NOW = new Date("2026-11-20T20:00:00.000Z");

beforeAll(createEventSettings);

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("seedRaffleDev without moving the hours", () => {
  it("creates the accounts, the passports and the tickets but leaves the raffle where it was", async () => {
    const before = await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } });

    const result = await seedRaffleDev({}, NOW, { moveHours: false });
    const after = await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } });

    expect(result).toMatchObject({ createdVisitors: 30, createdTickets: 40 });
    expect(result.createdAccounts).toHaveLength(2);
    expect(after.raffleStartsAt).toEqual(before.raffleStartsAt);
    expect(after.checkInCutoffAt).toEqual(before.checkInCutoffAt);
  });
});

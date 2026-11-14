/**
 * @jest-environment node
 */
import { KOF_DEV_ACCOUNTS, seedKofDev } from "@features/tournament/lib/server/tournament-dev-seed";
import { createEventSettings } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

// A few weeks before the bracket hour of the event.
const BEFORE_BRACKET = new Date("2026-10-28T18:00:00.000Z");

const AFTER_BRACKET = new Date("2026-11-20T18:00:00.000Z");

beforeAll(createEventSettings);

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("seedKofDev without moving the hours", () => {
  it("creates the accounts and no bracket while the bracket hour has not come, and leaves the hour alone", async () => {
    const before = await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } });

    const result = await seedKofDev({}, BEFORE_BRACKET, { moveHours: false });
    const after = await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } });

    expect(result).toEqual({
      createdAccounts: KOF_DEV_ACCOUNTS.map((account) => account.email).toSorted(),
      bracket: "notYet",
    });
    expect(after.kofBracketGeneratesAt).toEqual(before.kofBracketGeneratesAt);
    await expect(getPrisma().kofTournament.count()).resolves.toBe(0);
  });

  it("generates the bracket once its hour has come, without moving anything", async () => {
    const result = await seedKofDev({}, AFTER_BRACKET, { moveHours: false });

    expect(result.bracket).toBe("created");
  });
});

/**
 * @jest-environment node
 */
import { getVisitClosingTime } from "@features/stands/lib/server/visit-queries";
import { createEventSettings, CUTOFF_AT } from "@features/stands/__tests__/lib/server/stands-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

beforeAll(async () => {
  await createEventSettings();
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("getVisitClosingTime", () => {
  it("is the cutoff of the check-ins", async () => {
    await expect(getVisitClosingTime()).resolves.toEqual(CUTOFF_AT);
  });

  it("follows the cutoff when the sysadmin moves it", async () => {
    const later = new Date(CUTOFF_AT.getTime() + 10 * 60 * 1000);

    await getPrisma().eventSettings.update({
      where: { id: 1 },
      data: { checkInCutoffAt: later, raffleStartsAt: new Date(later.getTime() + 60_000) },
    });

    await expect(getVisitClosingTime()).resolves.toEqual(later);
  });
});

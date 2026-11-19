/**
 * @jest-environment node
 */
import { getPrisma } from "@shared/lib/server/prisma";
import { purgeExpiredServerLogs, SERVER_LOG_RETENTION_DAYS } from "@shared/lib/server/server-log-retention";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-11-20T18:00:00.000Z");

const DAY_MS = 24 * 60 * 60_000;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().serverLog.deleteMany();
});

function createLog(message: string, ageMs: number) {
  return getPrisma().serverLog.create({
    data: { level: "info", source: "worker", message, createdAt: new Date(NOW.getTime() - ageMs) },
  });
}

describe("purgeExpiredServerLogs", () => {
  it("keeps 30 days and removes only the rows older than that", async () => {
    await createLog("ancient", 90 * DAY_MS);
    await createLog("just over", SERVER_LOG_RETENTION_DAYS * DAY_MS + 1000);
    await createLog("exactly 30 days", SERVER_LOG_RETENTION_DAYS * DAY_MS);
    await createLog("yesterday", DAY_MS);
    await createLog("now", 0);

    await expect(purgeExpiredServerLogs(getPrisma(), NOW)).resolves.toBe(2);

    const kept = await getPrisma().serverLog.findMany({ orderBy: { message: "asc" } });

    expect(kept.map((row) => row.message)).toEqual(["exactly 30 days", "now", "yesterday"]);
  });

  it("removes nothing, and says so, when every row is recent", async () => {
    await createLog("recent", DAY_MS);

    await expect(purgeExpiredServerLogs(getPrisma(), NOW)).resolves.toBe(0);
    await expect(getPrisma().serverLog.count()).resolves.toBe(1);
  });

  it("is 30 days", () => {
    expect(SERVER_LOG_RETENTION_DAYS).toBe(30);
  });
});

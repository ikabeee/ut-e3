/**
 * @jest-environment node
 */
import type * as Retention from "@shared/lib/server/server-log-retention";
import { clearJobs, getJobStatus } from "@shared/lib/server/background-jobs";
import { getPrisma } from "@shared/lib/server/prisma";
import {
  purgeExpiredServerLogs,
  SERVER_LOG_RETENTION_DAYS,
  SERVER_LOG_RETENTION_JOB,
  startServerLogRetention,
} from "@shared/lib/server/server-log-retention";
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

describe("the 30-day boundary", () => {
  it("keeps exactly 30 days, deletes 30 days and 1 ms, and keeps a row dated in the future", async () => {
    await createLog("exactly 30 days", SERVER_LOG_RETENTION_DAYS * DAY_MS);
    await createLog("30 days and 1 ms", SERVER_LOG_RETENTION_DAYS * DAY_MS + 1);
    await createLog("in the future", -DAY_MS);

    await expect(purgeExpiredServerLogs(getPrisma(), NOW)).resolves.toBe(1);

    const kept = await getPrisma().serverLog.findMany({ orderBy: { message: "asc" } });

    expect(kept.map((row) => row.message)).toEqual(["exactly 30 days", "in the future"]);
  });
});

describe("startServerLogRetention as a job of the registry", () => {
  afterEach(() => {
    clearJobs();
  });

  it("registers an hourly job that /admin/recovery can read, and purges once right away", async () => {
    await createLog("ancient", 90 * DAY_MS);

    startServerLogRetention();

    expect(getJobStatus(SERVER_LOG_RETENTION_JOB)).toMatchObject({ intervalMs: 60 * 60_000, isRunning: true });
    await new Promise((resolve) => setTimeout(resolve, 200));

    await expect(getPrisma().serverLog.count()).resolves.toBe(0);
    expect(getJobStatus(SERVER_LOG_RETENTION_JOB)?.lastRunAt).not.toBeNull();
  });

  it("keeps a single timer when register() runs twice or the module is loaded twice (hot reload)", () => {
    const setIntervalSpy = jest.spyOn(globalThis, "setInterval");

    jest.isolateModules(() => {
      jest.requireActual<typeof Retention>("@shared/lib/server/server-log-retention").startServerLogRetention();
      jest.requireActual<typeof Retention>("@shared/lib/server/server-log-retention").startServerLogRetention();
    });
    jest.isolateModules(() => {
      jest.requireActual<typeof Retention>("@shared/lib/server/server-log-retention").startServerLogRetention();
    });

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    setIntervalSpy.mockRestore();
  });
});

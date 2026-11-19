/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { purgeServerLogsAction } from "@features/admin/lib/logs-actions";
import { expectRefused, otherRoleCases, signInAs } from "@shared/__tests__/lib/server/sysadmin-only";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import { getPrisma } from "@shared/lib/server/prisma";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const refresh = jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const DAY_MS = 24 * 60 * 60_000;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  refresh.mockClear();
  await getPrisma().serverLog.deleteMany();
  await getPrisma().session.deleteMany();
});

function createLog(message: string, ageDays: number) {
  return getPrisma().serverLog.create({
    data: { level: "info", source: "worker", message, createdAt: new Date(Date.now() - ageDays * DAY_MS) },
  });
}

// The guard (S4): only the sysadmin reads and purges the logs, and nothing is deleted for anyone else.
it.each(otherRoleCases({ purgeServerLogsAction }))(
  "%s calling %s is sent to the login and deletes nothing",
  async (role, _name, action) => {
    await createLog("old", 40);

    await expectRefused(role, action);

    await expect(getPrisma().serverLog.count()).resolves.toBe(1);
  },
);

describe("purgeServerLogsAction", () => {
  it("deletes only the rows older than 30 days, audits who did it and how many, and refreshes the page", async () => {
    await createLog("old", 31);
    await createLog("recent", 29);
    const actorId = await signInAs("sysadmin");
    const auditBefore = await getPrisma().auditLog.count();

    await expect(purgeServerLogsAction()).resolves.toEqual({
      status: "done",
      message: ADMIN_COPY.logs.purged(1),
    });

    const kept = await getPrisma().serverLog.findMany();
    const audit = (await getPrisma().auditLog.findMany({ orderBy: { createdAt: "asc" } })).slice(auditBefore);

    expect(kept.map((row) => row.message)).toEqual(["recent"]);
    expect(audit).toEqual([
      expect.objectContaining({
        actorId,
        action: "admin.server_logs.purge",
        entityType: "server_logs",
        detail: { deleted: 1, olderThanDays: 30 },
      }),
    ]);
    expect(refresh).toHaveBeenCalled();
  });

  it("says so when there was nothing to delete, and still audits it", async () => {
    await createLog("recent", 1);
    await signInAs("sysadmin");

    await expect(purgeServerLogsAction()).resolves.toEqual({
      status: "done",
      message: ADMIN_COPY.logs.purged(0),
    });
    await expect(getPrisma().serverLog.count()).resolves.toBe(1);
  });
});

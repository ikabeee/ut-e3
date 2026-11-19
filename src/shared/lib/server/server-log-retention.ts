import "server-only";
import type { Prisma } from "@generated/prisma/client";
import { getJobStatus, startJob, trackRun } from "@shared/lib/server/background-jobs";
import { getPrisma } from "@shared/lib/server/prisma";
import { logServerEvent } from "@shared/lib/server/server-log";

/** The logs of the server (S4) live this long; the hourly job and "Purgar ahora" delete the older rows. */
export const SERVER_LOG_RETENTION_DAYS = 30;

/** The name of the job in the registry of background jobs, which /admin/recovery reads. */
export const SERVER_LOG_RETENTION_JOB = "server-log-retention";

const PURGE_INTERVAL_MS = 60 * 60_000;

const DAY_MS = 24 * 60 * 60_000;

/**
 * Started by instrumentation.ts as a job of the registry: purges now and then every hour. The registry lives on
 * globalThis, so a second `register()` or a second copy of the module (hot reload) finds the job and does nothing.
 */
export function startServerLogRetention(): void {
  if (getJobStatus(SERVER_LOG_RETENTION_JOB)) return;

  startJob({
    name: SERVER_LOG_RETENTION_JOB,
    intervalMs: PURGE_INTERVAL_MS,
    run: purgeOnce,
    onError: reportPurgeFailure,
  });

  trackRun(SERVER_LOG_RETENTION_JOB, purgeOnce).catch(reportPurgeFailure);
}

async function purgeOnce(): Promise<void> {
  await purgeExpiredServerLogs(getPrisma());
}

async function reportPurgeFailure(cause: unknown): Promise<void> {
  const message = cause instanceof Error ? cause.message : "Unknown error";

  await logServerEvent("error", "worker", `Server log retention failed: ${message}`);
}

/** Deletes the rows older than the retention and says how many; a row of exactly 30 days is kept. */
export async function purgeExpiredServerLogs(
  client: Prisma.TransactionClient,
  now: Date = new Date(),
): Promise<number> {
  const cutoff = new Date(now.getTime() - SERVER_LOG_RETENTION_DAYS * DAY_MS);
  const { count } = await client.serverLog.deleteMany({ where: { createdAt: { lt: cutoff } } });

  return count;
}

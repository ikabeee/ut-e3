import "server-only";
import type { Prisma } from "@generated/prisma/client";
import { getPrisma } from "@shared/lib/server/prisma";
import { logServerEvent } from "@shared/lib/server/server-log";

/** The logs of the server (S4) live this long; the hourly interval and "Purgar ahora" delete the older rows. */
export const SERVER_LOG_RETENTION_DAYS = 30;

const PURGE_INTERVAL_MS = 60 * 60_000;

const DAY_MS = 24 * 60 * 60_000;

// On globalThis, so a hot reload or a second copy of this module finds the timer the first one started.
const TIMER_KEY = Symbol.for("ut-e3.serverLogRetention");

const timers: Record<symbol, ReturnType<typeof setInterval> | undefined> = globalThis;

/**
 * Started by instrumentation.ts: purges now and then every hour; the timer does not keep the process alive. Calling it
 * again, from a second `register()` or a second copy of the module, does nothing.
 */
export function startServerLogRetention(): void {
  if (timers[TIMER_KEY]) return;

  void purgeAndReport();

  const timer = setInterval(() => {
    void purgeAndReport();
  }, PURGE_INTERVAL_MS);

  timer.unref();
  timers[TIMER_KEY] = timer;
}

async function purgeAndReport(): Promise<void> {
  try {
    await purgeExpiredServerLogs(getPrisma());
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unknown error";

    await logServerEvent("error", "worker", `Server log retention failed: ${message}`);
  }
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

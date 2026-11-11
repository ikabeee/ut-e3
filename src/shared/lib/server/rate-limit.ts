import "server-only";
import { getPrisma } from "@shared/lib/server/prisma";

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

// Fixed windows aligned to the epoch (RNF-10). The attempt is counted before it is answered: SQLite runs one write at a
// time, so each concurrent request gets its own count and a burst cannot slip past the limit.
export async function consumeAttempt(key: string, rule: RateLimitRule, now = new Date()): Promise<boolean> {
  const windowStart = windowStartOf(now, rule.windowMs);

  const { count } = await getPrisma().rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  return count <= rule.limit;
}

/** Whether the key still has attempts in the current window, without spending one. */
export async function hasAttemptsLeft(key: string, rule: RateLimitRule, now = new Date()): Promise<boolean> {
  const windowStart = windowStartOf(now, rule.windowMs);

  const row = await getPrisma().rateLimit.findUnique({
    where: { key_windowStart: { key, windowStart } },
    select: { count: true },
  });

  return (row?.count ?? 0) < rule.limit;
}

/**
 * Gives back one attempt of the window of `now`, for a request that ended in a harmless mistake of the user. The
 * table only keeps counts above zero (CHECK of the migration), so giving back the only attempt deletes the row.
 */
export async function refundAttempt(key: string, rule: RateLimitRule, now: Date): Promise<void> {
  const windowStart = windowStartOf(now, rule.windowMs);

  await getPrisma().$transaction([
    getPrisma().rateLimit.deleteMany({ where: { key, windowStart, count: 1 } }),
    getPrisma().rateLimit.updateMany({
      where: { key, windowStart, count: { gt: 1 } },
      data: { count: { decrement: 1 } },
    }),
  ]);
}

export async function clearAttempts(key: string): Promise<void> {
  await getPrisma().rateLimit.deleteMany({ where: { key } });
}

function windowStartOf(now: Date, windowMs: number): Date {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

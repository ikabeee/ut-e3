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

export async function clearAttempts(key: string): Promise<void> {
  await getPrisma().rateLimit.deleteMany({ where: { key } });
}

function windowStartOf(now: Date, windowMs: number): Date {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

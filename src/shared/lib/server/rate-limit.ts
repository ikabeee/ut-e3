import "server-only";
import { getPrisma } from "@shared/lib/server/prisma";

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

// Fixed windows aligned to the epoch (RNF-10): every attempt in the same window shares one row and its count.
export async function isRateLimited(key: string, rule: RateLimitRule, now = new Date()): Promise<boolean> {
  const row = await getPrisma().rateLimit.findUnique({
    where: { key_windowStart: { key, windowStart: windowStartOf(now, rule.windowMs) } },
  });

  return (row?.count ?? 0) >= rule.limit;
}

export async function recordAttempt(key: string, rule: RateLimitRule, now = new Date()): Promise<void> {
  const windowStart = windowStartOf(now, rule.windowMs);

  await getPrisma().rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });
}

function windowStartOf(now: Date, windowMs: number): Date {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

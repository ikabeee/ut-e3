import "server-only";
import type { RateLimitRule } from "@shared/lib/server/rate-limit";

/**
 * The PIN attempts of a kiosk (RNF-10). A kiosk serves one visitor a minute at most, so this never stops a real queue; it
 * stops someone guessing PINs. The PIN screen and the offline queue share the same budget, so the queue cannot be used to
 * guess PINs faster than the screen (RF-78, RNF-19).
 */
export const KIOSK_ATTEMPT_RULE: RateLimitRule = { limit: 100, windowMs: 5 * 60 * 1000 };

export function kioskAttemptKey(accountId: string): string {
  return `kiosk:${accountId}`;
}

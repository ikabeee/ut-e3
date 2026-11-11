import { readFormText } from "@shared/lib/form-data";

export const REASON_MIN_LENGTH = 5;

export const REASON_MAX_LENGTH = 280;

export type ParsedReason = { isValid: true; reason: string } | { isValid: false };

/**
 * The reason of an annulment or an exclusion (RF-46): required, and short enough for the audit log. Invisible
 * characters (zero-width spaces, joiners) do not count, and it needs at least one letter or digit: "....." or five
 * zero-width spaces are not a reason anyone can read later.
 */
export function parseReason(form: FormData): ParsedReason {
  const reason = readFormText(form, "reason").trim().replaceAll(/\s+/g, " ");
  const visible = reason.replaceAll(/\p{Cf}/gu, "").trim();

  if (visible.length < REASON_MIN_LENGTH || reason.length > REASON_MAX_LENGTH) return { isValid: false };

  if (!/[\p{L}\p{N}]/u.test(visible)) return { isValid: false };

  return { isValid: true, reason };
}

/** Whether the raffle froze the tickets: from its start they no longer change (RF-46, RN-04, UT-AD-15). */
export function isRaffleStarted(raffleStartsAt: Date, now: Date): boolean {
  return now.getTime() >= raffleStartsAt.getTime();
}

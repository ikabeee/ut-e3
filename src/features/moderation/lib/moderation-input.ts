import { readFormText } from "@shared/lib/form-data";

export const REASON_MIN_LENGTH = 5;

export const REASON_MAX_LENGTH = 280;

export type ParsedReason = { isValid: true; reason: string } | { isValid: false };

/** The reason of an annulment or an exclusion (RF-46): required, and short enough for the audit log. */
export function parseReason(form: FormData): ParsedReason {
  const reason = readFormText(form, "reason").trim().replaceAll(/\s+/g, " ");

  if (reason.length < REASON_MIN_LENGTH || reason.length > REASON_MAX_LENGTH) return { isValid: false };

  return { isValid: true, reason };
}

/** Whether the raffle froze the tickets: from its start they no longer change (RF-46, RN-04, UT-AD-15). */
export function isRaffleStarted(raffleStartsAt: Date, now: Date): boolean {
  return now.getTime() >= raffleStartsAt.getTime();
}

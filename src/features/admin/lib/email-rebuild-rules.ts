import type { EmailKind } from "@shared/lib/email-kinds";

/**
 * The kinds that can be made again once their body was erased. A login code is not one: a new code only makes sense
 * when the person asks for it by logging in again. An emergency alert is not one either: it described a moment.
 */
export const REBUILDABLE_KINDS = [
  "visitor_passport",
  "recovery_link",
  "kof_entry",
  "staff_invitation",
  "password_reset",
  "raffle_winner",
] as const satisfies readonly EmailKind[];

export type RebuildableKind = (typeof REBUILDABLE_KINDS)[number];

export function isRebuildableKind(kind: EmailKind | null): kind is RebuildableKind {
  return REBUILDABLE_KINDS.some((rebuildable) => rebuildable === kind);
}

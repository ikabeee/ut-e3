import type { PendingDraw, RaffleAdminSnapshot } from "@features/raffle/lib/types";

/**
 * What the panel already knows from its own action and the next poll has not brought yet: the ticket it just drew, or
 * the ticket it just decided. `baseRevision` is the revision the panel had when the answer arrived.
 */
export type OptimisticDraw =
  | { kind: "drawn"; draw: PendingDraw; baseRevision: number }
  | { kind: "decided"; drawId: string; baseRevision: number };

/**
 * The ticket that waits for a decision. A poll with a higher revision than the action always wins, so a ticket another
 * administrator decided never stays on this screen.
 */
export function resolvePendingDraw(
  snapshot: Pick<RaffleAdminSnapshot, "pending" | "revision">,
  optimistic: OptimisticDraw | null,
): PendingDraw | null {
  if (!optimistic || snapshot.revision > optimistic.baseRevision) return snapshot.pending;

  if (optimistic.kind === "drawn") return optimistic.draw;

  return snapshot.pending?.id === optimistic.drawId ? null : snapshot.pending;
}

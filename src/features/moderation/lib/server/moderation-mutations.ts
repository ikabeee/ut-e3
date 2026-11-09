import "server-only";
import { isRaffleStarted } from "@features/moderation/lib/moderation-input";
import { voidUnreachedTickets } from "@features/visitors/lib/server/milestone-tickets";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";

export interface ModerationRequest {
  actorId: string;
  /** The check-in to annul or the visitor to exclude. */
  targetId: string;
  reason: string;
  now: Date;
}

export type AnnulResult =
  | { status: "annulled"; voidedMilestones: number[]; ticketsFrozen: boolean }
  | { status: "notFound" | "alreadyAnnulled" };

export type ExcludeResult = { status: "excluded"; ticketsFrozen: boolean } | { status: "notFound" | "alreadyExcluded" };

/**
 * Annuls a check-in and, with it, its vote (RF-46): the row stays with its date, reason and who annulled it, and
 * stops counting in visits, tickets, averages and alerts (UT-AD-03). Before the raffle, a ticket whose milestone the
 * visitor no longer reaches is voided in the same transaction (UT-AD-13); once the raffle started, tickets stay
 * frozen (UT-AD-15).
 */
export async function annulCheckIn(request: ModerationRequest): Promise<AnnulResult> {
  const { actorId, targetId, reason, now } = request;

  return getPrisma().$transaction(async (transaction): Promise<AnnulResult> => {
    const checkIn = await transaction.checkIn.findUnique({
      where: { id: targetId },
      select: { visitorId: true, standId: true, annulledAt: true },
    });

    if (!checkIn) return { status: "notFound" };

    const { count } = await transaction.checkIn.updateMany({
      where: { id: targetId, annulledAt: null },
      data: { annulledAt: now, annulledReason: reason, annulledById: actorId },
    });

    if (count === 0) return { status: "alreadyAnnulled" };

    const ticketsFrozen = await isFrozen(transaction, now);
    const voidedMilestones = ticketsFrozen ? [] : await voidUnreachedTickets(transaction, checkIn.visitorId);

    await recordAudit(transaction, {
      actorId,
      action: "check_in.annul",
      entityType: "check_in",
      entityId: targetId,
      detail: { visitorId: checkIn.visitorId, standId: checkIn.standId, reason, voidedMilestones, ticketsFrozen },
    });

    return { status: "annulled", voidedMilestones, ticketsFrozen };
  });
}

/**
 * Excludes a visitor with a reason (RF-46, UT-AD-01): nothing is deleted. Its visits stop counting, the kiosk refuses
 * its PIN, and its tickets stay out of the raffle; before the raffle they also become voided.
 */
export async function excludeVisitor(request: ModerationRequest): Promise<ExcludeResult> {
  const { actorId, targetId, reason, now } = request;

  return getPrisma().$transaction(async (transaction): Promise<ExcludeResult> => {
    const visitor = await transaction.visitor.findUnique({ where: { id: targetId }, select: { id: true } });

    if (!visitor) return { status: "notFound" };

    const { count } = await transaction.visitor.updateMany({
      where: { id: targetId, excludedAt: null },
      data: { excludedAt: now, excludedReason: reason },
    });

    if (count === 0) return { status: "alreadyExcluded" };

    const ticketsFrozen = await isFrozen(transaction, now);
    const voided = ticketsFrozen ? { count: 0 } : await voidAllTickets(transaction, targetId);

    await recordAudit(transaction, {
      actorId,
      action: "visitor.exclude",
      entityType: "visitor",
      entityId: targetId,
      detail: { reason, voidedTickets: voided.count, ticketsFrozen },
    });

    return { status: "excluded", ticketsFrozen };
  });
}

// Read from the table, not from the cache: the sysadmin can move the hour of the raffle.
async function isFrozen(transaction: Prisma.TransactionClient, now: Date): Promise<boolean> {
  const settings = await transaction.eventSettings.findUnique({ where: { id: 1 }, select: { raffleStartsAt: true } });

  return settings ? isRaffleStarted(settings.raffleStartsAt, now) : true;
}

async function voidAllTickets(transaction: Prisma.TransactionClient, visitorId: string) {
  return transaction.raffleTicket.updateMany({ where: { visitorId, status: "active" }, data: { status: "voided" } });
}

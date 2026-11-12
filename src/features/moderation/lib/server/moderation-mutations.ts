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

/** How many visits or visitors one bulk action takes: a form with more is not a review anymore. */
export const MAX_BULK_TARGETS = 200;

export interface BulkRequest {
  actorId: string;
  /** The check-ins the sysadmin ticked in a list. */
  checkInIds: string[];
  reason: string;
  now: Date;
}

export interface BulkResult {
  done: number;
  skipped: number;
}

/** Annuls each ticked visit with the same reason; one already annulled or gone is skipped, not an error. */
export async function annulCheckIns(request: BulkRequest): Promise<BulkResult> {
  const { checkInIds, ...rest } = request;

  const result = { done: 0, skipped: 0 };

  for (const targetId of uniqueTargets(checkInIds)) {
    const outcome = await annulCheckIn({ ...rest, targetId });

    result[outcome.status === "annulled" ? "done" : "skipped"] += 1;
  }

  return result;
}

/** Excludes the visitors behind the ticked visits, once each, with the same reason. */
export async function excludeVisitorsOfCheckIns(request: BulkRequest): Promise<BulkResult> {
  const { checkInIds, ...rest } = request;

  const checkIns = await getPrisma().checkIn.findMany({
    where: { id: { in: uniqueTargets(checkInIds) } },
    select: { visitorId: true },
  });

  const result = { done: 0, skipped: 0 };

  for (const targetId of new Set(checkIns.map((checkIn) => checkIn.visitorId))) {
    const outcome = await excludeVisitor({ ...rest, targetId });

    result[outcome.status === "excluded" ? "done" : "skipped"] += 1;
  }

  return result;
}

function uniqueTargets(ids: readonly string[]): string[] {
  return [...new Set(ids)].slice(0, MAX_BULK_TARGETS);
}

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

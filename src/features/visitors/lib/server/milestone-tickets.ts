import "server-only";

import type { Prisma } from "@generated/prisma/client";
import { TICKET_MILESTONES } from "@features/visitors/lib/passport-progress";

/** The check-ins that count: the sysadmin did not annul them (RF-46). */
export const VALID_CHECK_IN_WHERE = { annulledAt: null } satisfies Prisma.CheckInWhereInput;

/**
 * The tickets that may come out of the raffle: active and of a visitor that was not excluded (RF-46, UT-RA-12). The
 * raffle filters with this, because after it starts the tickets of an excluded visitor keep their status.
 */
export const RAFFLE_ELIGIBLE_TICKET_WHERE = {
  status: "active",
  visitor: { excludedAt: null },
} satisfies Prisma.RaffleTicketWhereInput;

/**
 * Runs inside the transaction that records a check-in, so a visit and its ticket are stored together. A ticket that was
 * voided by an annulment comes back with its original number when the visitor reaches the milestone again (RF-46).
 */
export async function grantMilestoneTickets(transaction: Prisma.TransactionClient, visitorId: string): Promise<number> {
  const visitCount = await countValidVisits(transaction, visitorId);
  const reached = TICKET_MILESTONES.filter((milestone) => visitCount >= milestone);

  if (reached.length === 0) return 0;

  const heldTickets = await transaction.raffleTicket.findMany({
    where: { visitorId },
    select: { milestone: true, status: true },
  });

  const held = new Map(heldTickets.map((ticket) => [ticket.milestone, ticket.status]));
  const missing = reached.filter((milestone) => !held.has(milestone));
  const voided = reached.filter((milestone) => held.get(milestone) === "voided");

  if (missing.length > 0) {
    await transaction.raffleTicket.createMany({ data: missing.map((milestone) => ({ visitorId, milestone })) });
  }

  if (voided.length > 0) {
    await transaction.raffleTicket.updateMany({
      where: { visitorId, milestone: { in: voided }, status: "voided" },
      data: { status: "active" },
    });
  }

  return missing.length + voided.length;
}

/**
 * After an annulment: the active tickets of milestones the visitor no longer reaches become voided, in the same
 * transaction. Returns the milestones it voided.
 */
export async function voidUnreachedTickets(
  transaction: Prisma.TransactionClient,
  visitorId: string,
): Promise<number[]> {
  const visitCount = await countValidVisits(transaction, visitorId);
  const unreached = TICKET_MILESTONES.filter((milestone) => visitCount < milestone);

  const tickets = await transaction.raffleTicket.findMany({
    where: { visitorId, status: "active", milestone: { in: unreached } },
    select: { milestone: true },
  });

  if (tickets.length === 0) return [];

  const milestones = tickets.map((ticket) => ticket.milestone);

  await transaction.raffleTicket.updateMany({
    where: { visitorId, status: "active", milestone: { in: milestones } },
    data: { status: "voided" },
  });

  return milestones;
}

export async function countValidVisits(transaction: Prisma.TransactionClient, visitorId: string): Promise<number> {
  return transaction.checkIn.count({ where: { visitorId, ...VALID_CHECK_IN_WHERE } });
}

import "server-only";

import type { Prisma } from "@generated/prisma/client";
import { TICKET_MILESTONES } from "@features/visitors/lib/passport-progress";

// Runs inside the transaction that records a check-in, so a visit and its ticket are stored together.
export async function grantMilestoneTickets(transaction: Prisma.TransactionClient, visitorId: string): Promise<number> {
  const visitCount = await transaction.checkIn.count({ where: { visitorId } });

  const heldTickets = await transaction.raffleTicket.findMany({
    where: { visitorId },
    select: { milestone: true },
  });

  const heldMilestones = new Set(heldTickets.map((ticket) => ticket.milestone));

  const missingMilestones = TICKET_MILESTONES.filter(
    (milestone) => visitCount >= milestone && !heldMilestones.has(milestone),
  );

  if (missingMilestones.length === 0) {
    return 0;
  }

  await transaction.raffleTicket.createMany({
    data: missingMilestones.map((milestone) => ({ visitorId, milestone })),
  });

  return missingMilestones.length;
}

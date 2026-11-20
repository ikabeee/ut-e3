import "server-only";

import type { Prisma } from "@generated/prisma/client";
import { KOF_ENTRY_MILESTONE } from "@features/raffle/lib/kof-entry-ticket";

/**
 * Runs in the transaction that creates the KOF entry. The ticket of an excluded visitor is born voided, as the exclusion
 * left the rest of their tickets (RF-46). A ticket the visitor already holds keeps its number and status.
 */
export async function grantKofEntryTicket(transaction: Prisma.TransactionClient, visitorId: string): Promise<void> {
  const visitor = await transaction.visitor.findUniqueOrThrow({
    where: { id: visitorId },
    select: { excludedAt: true },
  });

  await transaction.raffleTicket.upsert({
    where: { visitorId_milestone: { visitorId, milestone: KOF_ENTRY_MILESTONE } },
    create: { visitorId, milestone: KOF_ENTRY_MILESTONE, status: visitor.excludedAt ? "voided" : "active" },
    update: {},
  });
}

/**
 * After an exclusion is lifted: the KOF ticket comes back while the visitor is still entered, whether or not they
 * checked in. Returns how many tickets it reactivated (0 or 1).
 */
export async function reactivateKofEntryTicket(
  transaction: Prisma.TransactionClient,
  visitorId: string,
): Promise<number> {
  const entry = await transaction.tournamentEntry.findUnique({ where: { visitorId }, select: { id: true } });

  if (!entry) return 0;

  const { count } = await transaction.raffleTicket.updateMany({
    where: { visitorId, milestone: KOF_ENTRY_MILESTONE, status: "voided" },
    data: { status: "active" },
  });

  return count;
}

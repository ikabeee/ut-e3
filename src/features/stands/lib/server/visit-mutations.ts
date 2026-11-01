import "server-only";
import type { Ratings } from "@features/stands/lib/survey-input";
import { checkVisit, type VisitRefusal } from "@features/stands/lib/server/visit-queries";
import { grantMilestoneTickets } from "@features/visitors/lib/server/milestone-tickets";
import type { Prisma } from "@generated/prisma/client";
import { isUniqueViolation } from "@shared/lib/server/database-errors";
import { getPrisma } from "@shared/lib/server/prisma";

export type VisitResult = { status: "registered"; ticketsGranted: number } | VisitRefusal;

export interface VisitRecord {
  standId: string;
  /** The staff account that had the kiosk open (RF-36). */
  scannedById: string;
  ratings: Ratings;
}

export interface NewVisit extends VisitRecord {
  pin: string;
}

type SettlePending = (transaction: Prisma.TransactionClient) => Promise<unknown>;

/**
 * Records the visit and its survey in one transaction: without the survey there is no check-in (RF-28), and the ticket
 * of a milestone is granted in the same commit. A second visit of the same PIN to the stand loses to the table (RF-23).
 */
export async function registerVisit(visit: NewVisit, now: Date): Promise<VisitResult> {
  const check = await checkVisit(visit.standId, visit.pin, now);

  if (check.status !== "ready") return check;

  // The kiosk answered here, so a pending visit of the same passport at this stand has nothing left to wait for.
  const dropPending: SettlePending = (transaction) =>
    transaction.pendingVisit.deleteMany({ where: { visitorId: check.visitorId, standId: visit.standId } });

  return recordVisit(visit, check.visitorId, now, dropPending);
}

/** The write of a visit whose visitor and place were already checked; `settlePending` runs in the same transaction. */
export async function recordVisit(
  visit: VisitRecord,
  visitorId: string,
  now: Date,
  settlePending: SettlePending,
): Promise<VisitResult> {
  try {
    return await getPrisma().$transaction(async (transaction) => {
      const result = await insertVisit(transaction, visit, visitorId, now);

      await settlePending(transaction);

      return result;
    });
  } catch (cause) {
    if (isUniqueViolation(cause)) return { status: "alreadyVisited" };

    throw cause;
  }
}

async function insertVisit(
  transaction: Prisma.TransactionClient,
  visit: VisitRecord,
  visitorId: string,
  now: Date,
): Promise<VisitResult> {
  const checkIn = await transaction.checkIn.create({
    data: { visitorId, standId: visit.standId, scannedById: visit.scannedById, checkedInAt: now },
    select: { id: true },
  });

  await transaction.vote.create({
    data: { checkInId: checkIn.id, visitorId, standId: visit.standId, ...visit.ratings },
  });

  return { status: "registered", ticketsGranted: await grantMilestoneTickets(transaction, visitorId) };
}

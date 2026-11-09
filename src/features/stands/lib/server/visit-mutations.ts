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
  /** The id the kiosk gave to a visit of its offline queue; a new one otherwise. */
  checkInId?: string;
  /** When the kiosk took the PIN; a visit recorded at once was taken now (RN-04). */
  scannedAt?: Date;
}

export interface NewVisit extends VisitRecord {
  pin: string;
}

type SettlePending = (transaction: Prisma.TransactionClient) => Promise<void>;

/** A visit whose visitor and place were already checked; `settlePending` runs in the same transaction. */
export interface RecordedVisit {
  visit: VisitRecord;
  visitorId: string;
  now: Date;
  settlePending: SettlePending;
}

/**
 * Records the visit and its survey in one transaction: without the survey there is no check-in (RF-28), and the ticket
 * of a milestone is granted in the same commit. A second visit of the same PIN to the stand loses to the table (RF-23).
 */
export async function registerVisit(visit: NewVisit, now: Date): Promise<VisitResult> {
  const check = await checkVisit(visit.standId, visit.pin, now);

  if (check.status !== "ready") return check;

  // The kiosk answered here, so a pending visit of the same passport at this stand has nothing left to wait for.
  const dropPending: SettlePending = async (transaction) => {
    await transaction.pendingVisit.deleteMany({ where: { visitorId: check.visitorId, standId: visit.standId } });
  };

  return recordVisit({ visit, visitorId: check.visitorId, now, settlePending: dropPending });
}

/** The write of a visit that was already checked. */
export async function recordVisit(recorded: RecordedVisit): Promise<VisitResult> {
  const { visit, visitorId, now, settlePending } = recorded;

  try {
    return await getPrisma().$transaction(async (transaction) => {
      const result = await insertVisit(transaction, { visit, visitorId, now });

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
  { visit, visitorId, now }: Omit<RecordedVisit, "settlePending">,
): Promise<VisitResult> {
  // Read again inside the write: an exclusion committed after checkVisit (or while the visitor rated from the
  // passport) must not leave a visit or a ticket behind (RF-46, UT-CI-19).
  const visitor = await transaction.visitor.findUnique({ where: { id: visitorId }, select: { excludedAt: true } });

  if (!visitor) return { status: "unknownPin" };

  if (visitor.excludedAt) return { status: "excluded" };

  const checkIn = await transaction.checkIn.create({
    data: {
      id: visit.checkInId,
      visitorId,
      standId: visit.standId,
      scannedById: visit.scannedById,
      checkedInAt: now,
      scannedAt: visit.scannedAt ?? now,
    },
    select: { id: true },
  });

  await transaction.vote.create({
    data: { checkInId: checkIn.id, visitorId, standId: visit.standId, ...visit.ratings },
  });

  return { status: "registered", ticketsGranted: await grantMilestoneTickets(transaction, visitorId) };
}

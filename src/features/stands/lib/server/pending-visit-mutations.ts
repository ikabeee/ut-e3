import "server-only";
import { recordVisit, type NewVisit, type VisitResult } from "@features/stands/lib/server/visit-mutations";
import { checkVisit, checkVisitor } from "@features/stands/lib/server/visit-queries";
import type { Ratings } from "@features/stands/lib/survey-input";
import { getPrisma } from "@shared/lib/server/prisma";

/** How long the staff waits for the visitor to rate before the visit has to be started again. */
export const PENDING_VISIT_TTL_MS = 3 * 60 * 1000;

export type RequestVisitResult =
  | { status: "requested"; pendingVisitId: string }
  | { status: "closed" | "standWithoutGame" | "unknownPin" | "alreadyVisited" | "excluded" };

export type AnswerVisitResult = VisitResult | { status: "noPending" };

export type StartVisit = Pick<NewVisit, "standId" | "scannedById" | "pin">;

/**
 * The staff typed a PIN: the visit waits for the visitor to rate it from the passport. A visitor has one pending visit,
 * so starting another one at a different stand replaces it.
 */
export async function requestVisit(visit: StartVisit, now: Date): Promise<RequestVisitResult> {
  const check = await checkVisit(visit.standId, visit.pin, now);

  if (check.status !== "ready") return check;

  const pending = await getPrisma().$transaction(async (transaction) => {
    await transaction.pendingVisit.deleteMany({ where: { visitorId: check.visitorId } });

    return transaction.pendingVisit.create({
      data: {
        visitorId: check.visitorId,
        standId: visit.standId,
        requestedById: visit.scannedById,
        // The hour of the PIN for the cutoff (RN-04), from the same clock as the rest of the visit.
        createdAt: now,
        expiresAt: new Date(now.getTime() + PENDING_VISIT_TTL_MS),
      },
      select: { id: true },
    });
  });

  return { status: "requested", pendingVisitId: pending.id };
}

/** The staff gives up waiting. A visit that was already answered stays recorded. */
export async function cancelPendingVisit(pendingVisitId: string, standId: string): Promise<void> {
  await getPrisma().pendingVisit.deleteMany({ where: { id: pendingVisitId, standId, answeredAt: null } });
}

/** The visitor rated from the passport: the visit, the survey and the milestone ticket are recorded together (RF-28). */
export async function answerPendingVisit(visitorId: string, ratings: Ratings, now: Date): Promise<AnswerVisitResult> {
  const pending = await getPrisma().pendingVisit.findFirst({
    where: { visitorId, answeredAt: null, expiresAt: { gt: now } },
    select: { id: true, standId: true, requestedById: true, createdAt: true },
  });

  if (!pending) return { status: "noPending" };

  // The PIN was taken when the staff typed it: a survey answered after the cutoff still counts (RN-04).
  const scannedAt = pending.createdAt;
  const check = await checkVisitor(pending.standId, visitorId, { scannedAt, now });

  if (check.status !== "ready") return check;

  const visit = { standId: pending.standId, scannedById: pending.requestedById, ratings, scannedAt };

  return recordVisit({
    visit,
    visitorId,
    now,
    settlePending: async (transaction) => {
      await transaction.pendingVisit.updateMany({ where: { id: pending.id }, data: { answeredAt: now } });
    },
  });
}

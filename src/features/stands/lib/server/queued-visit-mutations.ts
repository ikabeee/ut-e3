import "server-only";
import type { ReceivedEntry, ReceivedQueuedVisit } from "@features/stands/lib/queued-visit-input";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import type { QueuedVisitResult, QueuedVisitStatus } from "@features/stands/lib/visit-queue";
import { clampScannedAt, isLateVisit, type VisitWindow } from "@features/stands/lib/visit-timing";
import { recordVisit } from "@features/stands/lib/server/visit-mutations";
import { isStaffOfStand } from "@features/stands/lib/server/visit-queries";
import { isUniqueViolation } from "@shared/lib/server/database-errors";
import { hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

export interface QueuedVisitBatch {
  standId: string;
  /** The staff account whose session sends the queue (RF-36). */
  scannedById: string;
  entries: ReceivedEntry[];
}

interface BatchContext {
  batch: QueuedVisitBatch;
  window: VisitWindow;
  receivedAt: Date;
}

/**
 * Records a batch of the offline queue of a kiosk (RF-35). Each visit gets its own answer and its own transaction, so a
 * refused one never stops the others (D4). Sending the same batch again answers `duplicate` and records nothing new.
 */
export async function registerQueuedVisits(batch: QueuedVisitBatch, receivedAt: Date): Promise<QueuedVisitResult[]> {
  const window = await readVisitWindow();
  const hasGame = (await getPrisma().game.count({ where: { standId: batch.standId } })) > 0;
  const context: BatchContext = { batch, window, receivedAt };
  const results: QueuedVisitResult[] = [];

  // One after the other: SQLite writes one transaction at a time anyway, and the order of the PINs is kept.
  for (const entry of batch.entries) {
    const status = hasGame ? await settleEntry(context, entry) : "standWithoutGame";

    results.push({ id: entry.id, status });
  }

  return results;
}

async function readVisitWindow(): Promise<VisitWindow> {
  const settings = await getPrisma().eventSettings.findUnique({
    where: { id: 1 },
    select: { eventStartsAt: true, checkInCutoffAt: true, raffleStartsAt: true },
  });

  if (!settings) throw new Error(STANDS_COPY.kiosk.errors.missingSettings);

  return settings;
}

async function settleEntry(context: BatchContext, entry: ReceivedEntry): Promise<QueuedVisitStatus> {
  if (!entry.visit) return "invalid";

  const previous = await findPreviousAnswer(entry.id);

  if (previous) return previous;

  const visitor = await getPrisma().visitor.findUnique({
    where: { pinLookup: hashPinForLookup(entry.visit.pin) },
    select: { id: true, email: true },
  });

  if (!visitor) return "unknownVisitor";

  return settleVisit(context, entry.visit, visitor);
}

// The kiosk retries a batch whose answer it never received: the first answer is the one that counts.
async function findPreviousAnswer(id: string): Promise<QueuedVisitStatus | null> {
  if (await getPrisma().checkIn.findUnique({ where: { id }, select: { id: true } })) return "duplicate";

  const rejected = await getPrisma().rejectedVisit.findUnique({ where: { id }, select: { reason: true } });

  if (!rejected) return null;

  return rejected.reason === "ownStand" ? "ownStand" : "late";
}

async function settleVisit(
  context: BatchContext,
  visit: ReceivedQueuedVisit,
  visitor: { id: string; email: string },
): Promise<QueuedVisitStatus> {
  const { batch, window, receivedAt } = context;
  const { id: visitorId } = visitor;
  const scannedAt = clampScannedAt(visit.scannedAt, receivedAt, window.eventStartsAt);

  // A visitor whose visit to the stand already counts gets no notice that it "did not register" (EC-03, RF-24).
  if (await hasVisitedStand(visitorId, batch.standId)) return "duplicate";

  // The staff of a stand does not count visits to it (RN-02): the passport shows the notice, as with a late one.
  const reason = await findRejectionReason({
    visitor,
    standId: batch.standId,
    isLate: isLateVisit(scannedAt, receivedAt, window),
  });

  if (reason) {
    await recordRejection({ id: visit.id, visitorId, standId: batch.standId, scannedAt, reason });

    return reason;
  }

  const result = await recordVisit({
    visit: {
      standId: batch.standId,
      scannedById: batch.scannedById,
      ratings: visit.ratings,
      checkInId: visit.id,
      scannedAt,
    },
    visitorId,
    now: receivedAt,
    settlePending: async (transaction) => {
      await transaction.pendingVisit.deleteMany({ where: { visitorId, standId: batch.standId } });
    },
  });

  return result.status === "registered" ? "ok" : "duplicate";
}

async function findRejectionReason(check: {
  visitor: { email: string };
  standId: string;
  isLate: boolean;
}): Promise<"late" | "ownStand" | null> {
  if (await isStaffOfStand(check.standId, check.visitor.email)) return "ownStand";

  return check.isLate ? "late" : null;
}

async function hasVisitedStand(visitorId: string, standId: string): Promise<boolean> {
  return (await getPrisma().checkIn.count({ where: { visitorId, standId } })) > 0;
}

// The passport shows it (RF-24); two batches that carry the same visit record it once.
async function recordRejection(rejection: {
  id: string;
  visitorId: string;
  standId: string;
  scannedAt: Date;
  reason: "late" | "ownStand";
}) {
  try {
    await getPrisma().rejectedVisit.create({ data: rejection });
  } catch (cause) {
    if (!isUniqueViolation(cause)) throw cause;
  }
}

import type { QueuedVisit, RejectedQueuedVisit, VisitQueueStore } from "@features/stands/lib/visit-queue";

/** The queue of the kiosk in memory, in place of IndexedDB (jsdom has none). */
export function createMemoryVisitQueueStore() {
  const pending = new Map<string, QueuedVisit>();
  const rejected = new Map<string, RejectedQueuedVisit>();

  const store: VisitQueueStore = {
    listPending: async () => [...pending.values()],
    addPending: async (visit) => {
      pending.set(visit.id, visit);
    },
    removePending: async (ids) => {
      ids.forEach((id) => pending.delete(id));
    },
    listRejected: async () => [...rejected.values()],
    addRejected: async (visits) => {
      visits.forEach((visit) => rejected.set(visit.id, visit));
    },
  };

  return { store, pending, rejected };
}

/** A queued visit with the given id, PIN and hour. */
export function queuedVisit(id: string, pin = "12345", scannedAt = "2026-11-20T20:00:00.000Z"): QueuedVisit {
  return { id, pin, ratings: { gameRating: 4, standRating: 5, artRating: 3 }, scannedAt };
}

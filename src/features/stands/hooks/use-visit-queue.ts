"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildBatches,
  getRetryDelay,
  settleBatch,
  type QueuedVisit,
  type QueuedVisitResult,
  type RejectedQueuedVisit,
  type VisitQueueStore,
} from "@features/stands/lib/visit-queue";

/** `sending` while a batch travels, `retrying` while it waits after a failure, `allSent` once the queue empties. */
export type VisitQueuePhase = "idle" | "sending" | "retrying" | "allSent";

export interface VisitQueueOptions {
  store: VisitQueueStore;
  send: (visits: QueuedVisit[]) => Promise<QueuedVisitResult[]>;
  isOnline: boolean;
}

export interface VisitQueue {
  pendingCount: number;
  rejected: RejectedQueuedVisit[];
  phase: VisitQueuePhase;
  /** Saves a visit taken without connection; it resolves once the visit is on disk. */
  enqueue: (visit: QueuedVisit) => Promise<void>;
}

interface QueueView {
  pendingCount: number;
  rejected: RejectedQueuedVisit[];
}

/**
 * The offline queue of the kiosk (RF-35): sends the saved visits in batches of 50 while there is a network, and waits
 * with exponential backoff and jitter after each failure. One flush runs at a time.
 */
export function useVisitQueue({ store, send, isOnline }: Readonly<VisitQueueOptions>): VisitQueue {
  const [view, setView] = useState<QueueView>({ pendingCount: 0, rejected: [] });
  const [phase, setPhase] = useState<VisitQueuePhase>("idle");
  // Failures in a row: each one schedules the next try (useQueueTriggers) with a longer wait.
  const [failures, setFailures] = useState(0);
  const flushing = useRef(false);

  const refreshView = useCallback(async () => {
    try {
      const [pending, rejected] = await Promise.all([store.listPending(), store.listRejected()]);

      setView({ pendingCount: pending.length, rejected: sortByScan(rejected) });
    } catch {
      // A browser without IndexedDB (or with it blocked) keeps the last view; saving a visit then tells the staff.
    }
  }, [store]);

  const flush = useCallback(async () => {
    if (flushing.current || !navigator.onLine) return;

    flushing.current = true;

    try {
      const sent = await sendAll({ store, send, onStart: () => setPhase("sending"), onProgress: refreshView });

      if (sent) setPhase("allSent");
      setFailures(0);
    } catch {
      setPhase("retrying");
      setFailures((current) => current + 1);
    } finally {
      flushing.current = false;
      await refreshView();
    }
  }, [store, send, refreshView]);

  useQueueTriggers({ isOnline, failures, flush, refreshView });

  const enqueue = useCallback(
    async (visit: QueuedVisit) => {
      await store.addPending(visit);
      await refreshView();
      void flush();
    },
    [store, refreshView, flush],
  );

  return { ...view, phase, enqueue };
}

interface SendAllOptions {
  store: VisitQueueStore;
  send: VisitQueueOptions["send"];
  onStart: () => void;
  onProgress: () => Promise<void>;
}

// Sends batch after batch until the queue is empty, and says whether there was anything to send. A failed request throws
// and leaves the rest of the queue for the retry.
async function sendAll({ store, send, onStart, onProgress }: SendAllOptions): Promise<boolean> {
  let [batch] = buildBatches(await store.listPending());

  if (!batch) return false;

  onStart();

  while (batch) {
    const settled = settleBatch(batch, await send(batch));

    // An answer that settles nothing would send the same batch forever: it waits for the retry like a failure.
    if (settled.settledIds.length === 0) throw new Error("El servidor no respondió por ninguna visita del lote.");

    await store.addRejected(settled.rejected);
    await store.removePending(settled.settledIds);
    await onProgress();
    [batch] = buildBatches(await store.listPending());
  }

  return true;
}

interface QueueTriggers {
  isOnline: boolean;
  failures: number;
  flush: () => Promise<void>;
  refreshView: () => Promise<void>;
}

// Reads the queue when the kiosk opens, sends it each time the network comes back and retries after a failure.
function useQueueTriggers({ isOnline, failures, flush, refreshView }: QueueTriggers): void {
  useEffect(() => {
    void refreshView();
  }, [refreshView]);

  useEffect(() => {
    if (isOnline) void flush();
  }, [isOnline, flush]);

  useEffect(() => {
    if (failures === 0) return;

    const timer = window.setTimeout(() => void flush(), getRetryDelay(failures));

    return () => window.clearTimeout(timer);
  }, [failures, flush]);
}

function sortByScan(rejected: RejectedQueuedVisit[]): RejectedQueuedVisit[] {
  return [...rejected].sort((left, right) => right.scannedAt.localeCompare(left.scannedAt));
}

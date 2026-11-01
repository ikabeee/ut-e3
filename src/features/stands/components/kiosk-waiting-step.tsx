"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@heroui/react";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import type { VisitStatus } from "@features/stands/lib/pending-visit";
import { usePolledValue } from "@shared/hooks/use-polled-value";

interface KioskWaitingStepProps {
  pendingVisitId: string;
  /** A function that does not change between renders: it builds the request that asks how the visit is going. */
  createStatusLoader: (pendingVisitId: string) => () => Promise<VisitStatus>;
  onAnswered: () => void;
  onExpired: () => void;
  onAnswerHere: () => void;
  onCancel: () => void;
}

const COPY = STANDS_COPY.kiosk.waiting;

const POLL_INTERVAL_MS = 2000;

/** The visitor rates from the passport; the kiosk only waits, and offers its own survey when the phone has no signal. */
export function KioskWaitingStep({
  pendingVisitId,
  createStatusLoader,
  onAnswered,
  onExpired,
  onAnswerHere,
  onCancel,
}: Readonly<KioskWaitingStepProps>) {
  const loadStatus = useMemo(() => createStatusLoader(pendingVisitId), [createStatusLoader, pendingVisitId]);
  const { value: status, hasConnectionError } = usePolledValue<VisitStatus>("waiting", {
    load: loadStatus,
    merge: takeIncoming,
    intervalMs: POLL_INTERVAL_MS,
  });

  useEffect(() => {
    if (status === "answered") onAnswered();

    if (status === "expired") onExpired();
  }, [status, onAnswered, onExpired]);

  return (
    <div role="status" className="grid w-full max-w-xl gap-5 border border-border p-8">
      <h2 className="type-section">{COPY.heading}</h2>
      <p className="m-0">{COPY.message}</p>
      {hasConnectionError ? <p className="m-0 type-tiny text-muted">{COPY.connectionError}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" className="min-h-11" onPress={onAnswerHere}>
          {COPY.answerHere}
        </Button>
        <Button variant="tertiary" className="min-h-11" onPress={onCancel}>
          {COPY.cancel}
        </Button>
      </div>
    </div>
  );
}

function takeIncoming(_current: VisitStatus, incoming: VisitStatus): VisitStatus {
  return incoming;
}

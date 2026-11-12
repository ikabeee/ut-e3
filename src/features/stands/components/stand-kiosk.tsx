"use client";

import { useActionState, useCallback, useMemo, useState } from "react";
import { useNow } from "@shared/hooks/use-now";
import { useOnlineStatus } from "@shared/hooks/use-online-status";
import { formatTimeOfDay } from "@shared/lib/date-time";
import { createVisitStatusLoader, fetchPinFilter, sendQueuedVisits } from "@features/stands/api/stands-api-client";
import { KioskPinStep } from "@features/stands/components/kiosk-pin-step";
import { KioskQueueStatus } from "@features/stands/components/kiosk-queue-status";
import { KioskSurveyStep } from "@features/stands/components/kiosk-survey-step";
import { KioskThanks } from "@features/stands/components/kiosk-thanks";
import { KioskWaitingStep } from "@features/stands/components/kiosk-waiting-step";
import {
  useQueuedSurvey,
  useRequestOrOffline,
  useSubmitOrQueue,
  type OfflineKiosk,
} from "@features/stands/hooks/use-offline-kiosk";
import { usePinFilter } from "@features/stands/hooks/use-pin-filter";
import { useVisitQueue } from "@features/stands/hooks/use-visit-queue";
import type { VisitStatus } from "@features/stands/lib/pending-visit";
import type { PinFilter } from "@features/stands/lib/pin-filter";
import type { RequestVisitState, VisitActionState } from "@features/stands/lib/stands-actions";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import type { QueuedVisit, QueuedVisitResult, VisitQueueStore } from "@features/stands/lib/visit-queue";
import { createIndexedDbVisitQueueStore } from "@features/stands/lib/visit-queue-store";

export interface KioskActions {
  requestVisit: (previous: RequestVisitState | null, form: FormData) => Promise<RequestVisitState>;
  submitVisit: (previous: VisitActionState | null, form: FormData) => Promise<VisitActionState>;
  cancelVisit: (pendingVisitId: string) => Promise<void>;
}

/** How the kiosk works without connection; the tests replace IndexedDB and the network (RF-35, RF-78). */
export interface KioskOfflineSupport {
  createStore: (standCode: string) => VisitQueueStore;
  sendBatch: (visits: QueuedVisit[]) => Promise<QueuedVisitResult[]>;
  loadPinFilter: () => Promise<PinFilter>;
}

interface StandKioskProps {
  standCode: string;
  gameName: string;
  /** ISO hour from which the kiosk records no visits: the PIN is not asked for after it. */
  closesAt: string;
  actions: KioskActions;
  /** Builds the function that asks how a pending visit is going; a function that does not change between renders. */
  createStatusLoader?: (pendingVisitId: string) => () => Promise<VisitStatus>;
  /** Stable between renders: the queue and the filter are built from it once. */
  offlineSupport?: KioskOfflineSupport;
}

interface KioskRoundProps {
  isClosed: boolean;
  actions: KioskActions;
  createStatusLoader: (pendingVisitId: string) => () => Promise<VisitStatus>;
  offline: OfflineKiosk;
  onFinished: (notice?: string) => void;
}

type Screen = "waiting" | "answerHere" | "answeredByPhone";

const COPY = STANDS_COPY.kiosk;

const CLOSED_CHECK_MS = 5000;

const BROWSER_OFFLINE_SUPPORT: KioskOfflineSupport = {
  createStore: createIndexedDbVisitQueueStore,
  sendBatch: sendQueuedVisits,
  loadPinFilter: fetchPinFilter,
};

export function StandKiosk({
  standCode,
  gameName,
  closesAt,
  actions,
  createStatusLoader = createVisitStatusLoader,
  offlineSupport = BROWSER_OFFLINE_SUPPORT,
}: Readonly<StandKioskProps>) {
  const [round, setRound] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const { isOnline, queue, offline } = useKioskOffline(standCode, offlineSupport);
  const isClosed = useIsPast(closesAt);

  const startNextRound = useCallback((nextNotice?: string) => {
    setRound((current) => current + 1);
    setNotice(nextNotice ?? null);
  }, []);

  return (
    <section aria-label={COPY.standLabel(standCode, gameName)} className="grid grid-cols-1 justify-items-center gap-8">
      <p className="m-0 type-mono text-muted">{COPY.standLabel(standCode, gameName)}</p>
      <KioskQueueStatus
        isOnline={isOnline}
        pendingCount={queue.pendingCount}
        phase={queue.phase}
        rejected={queue.rejected}
      />
      {isClosed ? <KioskClosedNotice closesAt={closesAt} /> : null}
      {notice ? <KioskNotice message={notice} /> : null}
      <KioskRound
        key={round}
        isClosed={isClosed}
        actions={actions}
        createStatusLoader={createStatusLoader}
        offline={offline}
        onFinished={startNextRound}
      />
    </section>
  );
}

function KioskNotice({ message }: Readonly<{ message: string }>) {
  return (
    <p role="status" className="m-0 border border-border p-4">
      {message}
    </p>
  );
}

function KioskClosedNotice({ closesAt }: Readonly<{ closesAt: string }>) {
  return (
    <p role="status" className="m-0 w-full max-w-sm border border-danger p-4" data-testid="kiosk-closed">
      {COPY.closedNotice(formatTimeOfDay(closesAt))}
    </p>
  );
}

// The hour is read in the browser and checked every few seconds, so the notice appears at the cutoff without a reload.
function useIsPast(instant: string): boolean {
  const now = useNow(CLOSED_CHECK_MS);

  return now > 0 && now >= Date.parse(instant);
}

// The queue, the filter and the network status, shared by every round of the kiosk.
function useKioskOffline(standCode: string, support: KioskOfflineSupport) {
  const isOnline = useOnlineStatus();
  const store = useMemo(() => support.createStore(standCode), [support, standCode]);
  const queue = useVisitQueue({ store, send: support.sendBatch, isOnline });
  const checkPin = usePinFilter({ load: support.loadPinFilter, isOnline });
  const { enqueue } = queue;
  const offline = useMemo<OfflineKiosk>(() => ({ checkPin, enqueue }), [checkPin, enqueue]);

  return { isOnline, queue, offline };
}

// One visitor, from the PIN to the thanks. A new key gives the next visitor empty screens and empty action states.
function KioskRound({ isClosed, actions, createStatusLoader, offline, onFinished }: Readonly<KioskRoundProps>) {
  const requestOrOffline = useRequestOrOffline(actions.requestVisit, offline);
  const [requestState, requestVisit, isRequesting] = useActionState(requestOrOffline, null);

  if (requestState?.status === "offline") {
    return <KioskQueuedVisit pin={requestState.pin} offline={offline} onFinished={onFinished} />;
  }

  if (requestState?.status !== "waiting") {
    return <KioskPinStep state={requestState} action={requestVisit} isPending={isRequesting} isDisabled={isClosed} />;
  }

  return (
    <KioskVisit
      visit={requestState}
      isClosed={isClosed}
      actions={actions}
      createStatusLoader={createStatusLoader}
      offline={offline}
      onFinished={onFinished}
    />
  );
}

interface KioskQueuedVisitProps {
  pin: string;
  offline: OfflineKiosk;
  onFinished: KioskRoundProps["onFinished"];
}

// A visit without connection: the survey is answered on the kiosk and the visit waits in the queue (RF-35).
function KioskQueuedVisit({ pin, offline, onFinished }: Readonly<KioskQueuedVisitProps>) {
  const queueSurvey = useQueuedSurvey(pin, offline);
  const [visitState, submitVisit, isSaving] = useActionState(queueSurvey, null);
  const handleCancel = useCallback(() => onFinished(), [onFinished]);

  if (visitState?.status === "done") return <KioskThanks message={visitState.message} onFinished={onFinished} />;

  return (
    <KioskSurveyStep pin={pin} state={visitState} action={submitVisit} isPending={isSaving} onCancel={handleCancel} />
  );
}

interface KioskVisitProps extends KioskRoundProps {
  visit: { pin: string; pendingVisitId: string };
}

// A visit that is waiting: from the wait for the phone to the thanks, with the fallback of rating on this screen.
function KioskVisit({ visit, actions, createStatusLoader, offline, onFinished }: Readonly<KioskVisitProps>) {
  const submitOrQueue = useSubmitOrQueue(actions.submitVisit, visit.pin, offline);
  const [visitState, submitVisit, isSending] = useActionState(submitOrQueue, null);
  const [screen, setScreen] = useState<Screen>("waiting");
  const handleAnswered = useCallback(() => setScreen("answeredByPhone"), []);
  const handleExpired = useCallback(() => onFinished(COPY.expired), [onFinished]);
  const handleAnswerHere = useCallback(() => setScreen("answerHere"), []);

  const handleCancel = useCallback(
    () => void cancelAndFinish(actions, visit.pendingVisitId, onFinished),
    [actions, visit.pendingVisitId, onFinished],
  );

  if (visitState?.status === "done") return <KioskThanks message={visitState.message} onFinished={onFinished} />;

  if (screen === "answeredByPhone") return <KioskThanks message={COPY.thanks.message} onFinished={onFinished} />;

  if (screen === "answerHere") {
    return (
      <KioskSurveyStep
        pin={visit.pin}
        state={visitState}
        action={submitVisit}
        isPending={isSending}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <KioskWaitingStep
      pendingVisitId={visit.pendingVisitId}
      createStatusLoader={createStatusLoader}
      onAnswered={handleAnswered}
      onExpired={handleExpired}
      onAnswerHere={handleAnswerHere}
      onCancel={handleCancel}
    />
  );
}

// Without connection the pending visit cannot be cancelled on the server; it expires there by itself in 3 minutes.
async function cancelAndFinish(
  actions: KioskActions,
  pendingVisitId: string,
  onFinished: KioskRoundProps["onFinished"],
): Promise<void> {
  try {
    await actions.cancelVisit(pendingVisitId);
  } catch {
    // The kiosk moves on to the next visitor anyway.
  }

  onFinished();
}

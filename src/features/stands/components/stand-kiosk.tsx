"use client";

import { useActionState, useCallback, useState } from "react";
import { createVisitStatusLoader } from "@features/stands/api/stands-api-client";
import { KioskPinStep } from "@features/stands/components/kiosk-pin-step";
import { KioskSurveyStep } from "@features/stands/components/kiosk-survey-step";
import { KioskThanks } from "@features/stands/components/kiosk-thanks";
import { KioskWaitingStep } from "@features/stands/components/kiosk-waiting-step";
import type { VisitStatus } from "@features/stands/lib/pending-visit";
import type { RequestVisitState, VisitActionState } from "@features/stands/lib/stands-actions";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";

export interface KioskActions {
  requestVisit: (previous: RequestVisitState | null, form: FormData) => Promise<RequestVisitState>;
  submitVisit: (previous: VisitActionState | null, form: FormData) => Promise<VisitActionState>;
  cancelVisit: (pendingVisitId: string) => Promise<void>;
}

interface StandKioskProps {
  standCode: string;
  gameName: string;
  actions: KioskActions;
  /** Builds the function that asks how a pending visit is going; a function that does not change between renders. */
  createStatusLoader?: (pendingVisitId: string) => () => Promise<VisitStatus>;
}

interface KioskRoundProps {
  actions: KioskActions;
  createStatusLoader: (pendingVisitId: string) => () => Promise<VisitStatus>;
  onFinished: (notice?: string) => void;
}

type Screen = "waiting" | "answerHere" | "answeredByPhone";

const COPY = STANDS_COPY.kiosk;

export function StandKiosk({
  standCode,
  gameName,
  actions,
  createStatusLoader = createVisitStatusLoader,
}: Readonly<StandKioskProps>) {
  const [round, setRound] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const startNextRound = useCallback((nextNotice?: string) => {
    setRound((current) => current + 1);
    setNotice(nextNotice ?? null);
  }, []);

  return (
    <section aria-label={COPY.standLabel(standCode, gameName)} className="grid justify-items-center gap-8">
      <p className="m-0 type-mono text-muted">{COPY.standLabel(standCode, gameName)}</p>
      {notice ? (
        <p role="status" className="m-0 border border-border p-4">
          {notice}
        </p>
      ) : null}
      <KioskRound key={round} actions={actions} createStatusLoader={createStatusLoader} onFinished={startNextRound} />
    </section>
  );
}

// One visitor, from the PIN to the thanks. A new key gives the next visitor empty screens and empty action states.
function KioskRound({ actions, createStatusLoader, onFinished }: Readonly<KioskRoundProps>) {
  const [requestState, requestVisit, isRequesting] = useActionState(actions.requestVisit, null);

  if (requestState?.status !== "waiting") {
    return <KioskPinStep state={requestState} action={requestVisit} isPending={isRequesting} />;
  }

  return (
    <KioskVisit
      visit={requestState}
      actions={actions}
      createStatusLoader={createStatusLoader}
      onFinished={onFinished}
    />
  );
}

interface KioskVisitProps extends KioskRoundProps {
  visit: { pin: string; pendingVisitId: string };
}

// A visit that is waiting: from the wait for the phone to the thanks, with the fallback of rating on this screen.
function KioskVisit({ visit, actions, createStatusLoader, onFinished }: Readonly<KioskVisitProps>) {
  const [visitState, submitVisit, isSending] = useActionState(actions.submitVisit, null);
  const [screen, setScreen] = useState<Screen>("waiting");
  const handleAnswered = useCallback(() => setScreen("answeredByPhone"), []);
  const handleExpired = useCallback(() => onFinished(COPY.expired), [onFinished]);
  const handleAnswerHere = useCallback(() => setScreen("answerHere"), []);

  const handleCancel = useCallback(
    () => void cancelAndFinish(actions, visit.pendingVisitId, onFinished),
    [actions, visit.pendingVisitId, onFinished],
  );

  if (visitState?.status === "done" || screen === "answeredByPhone") {
    return (
      <KioskThanks
        message={visitState?.status === "done" ? visitState.message : COPY.thanks.message}
        onFinished={onFinished}
      />
    );
  }

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

async function cancelAndFinish(
  actions: KioskActions,
  pendingVisitId: string,
  onFinished: KioskRoundProps["onFinished"],
): Promise<void> {
  await actions.cancelVisit(pendingVisitId);
  onFinished();
}

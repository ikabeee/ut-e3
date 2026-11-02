"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { Form } from "@heroui/react";
import { useRouter } from "next/navigation";
import { fetchPendingVisit } from "@features/stands/api/stands-api-client";
import { KioskRatingField } from "@features/stands/components/kiosk-rating-field";
import type { PendingVisitView } from "@features/stands/lib/pending-visit";
import type { VisitActionState } from "@features/stands/lib/stands-actions";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { RATING_FIELDS } from "@features/stands/lib/survey-input";
import { FormSubmit } from "@shared/components/form-submit";
import { usePolledValue } from "@shared/hooks/use-polled-value";

interface VisitSurveyPromptProps {
  answerVisit: (previous: VisitActionState | null, form: FormData) => Promise<VisitActionState>;
  loadPending?: () => Promise<PendingVisitView | null>;
}

interface PendingSurveyProps {
  pending: PendingVisitView;
  answerVisit: VisitSurveyPromptProps["answerVisit"];
  onRecorded: () => void;
}

const COPY = STANDS_COPY.passportSurvey;

const FIELD_COPY = STANDS_COPY.kiosk.survey;

const POLL_INTERVAL_MS = 3000;

const THANKS_DURATION_MS = 4000;

/**
 * Sits on the passport: when the staff of a stand types the PIN, the visitor rates the visit from their own phone and
 * that records it (RF-26, RF-28). Nothing shows while there is no visit waiting.
 */
export function VisitSurveyPrompt({ answerVisit, loadPending = fetchPendingVisit }: Readonly<VisitSurveyPromptProps>) {
  const router = useRouter();

  const { value: pending } = usePolledValue<PendingVisitView | null>(null, {
    load: loadPending,
    merge: takeIncoming,
    intervalMs: POLL_INTERVAL_MS,
  });

  const [isThanking, setIsThanking] = useState(false);
  const handleRecorded = useCallback(() => setIsThanking(true), []);

  // The passport is a Server Component and refreshing it can mount this prompt again, so the thanks is read first and
  // the refresh that shows the new visit and the ticket it may have granted comes after it.
  useEffect(() => {
    if (!isThanking) return;

    const timer = window.setTimeout(() => {
      setIsThanking(false);
      router.refresh();
    }, THANKS_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [isThanking, router]);

  if (isThanking) {
    return (
      <Overlay label={COPY.heading}>
        <p role="status" className="m-0 text-lg">
          {COPY.thanks}
        </p>
      </Overlay>
    );
  }

  if (!pending) return null;

  return (
    <Overlay label={COPY.heading}>
      <PendingSurvey key={pending.id} pending={pending} answerVisit={answerVisit} onRecorded={handleRecorded} />
    </Overlay>
  );
}

function PendingSurvey({ pending, answerVisit, onRecorded }: Readonly<PendingSurveyProps>) {
  const [state, action, isPending] = useActionState(answerVisit, null);
  const isDone = state?.status === "done";

  useEffect(() => {
    if (isDone) onRecorded();
  }, [isDone, onRecorded]);

  return (
    <Form action={action} className="grid gap-6">
      <div>
        <h2 className="type-section">{COPY.heading}</h2>
        <p className="mt-2 type-mono">{COPY.standLine(pending.standCode, pending.gameName)}</p>
        <p className="mt-2 text-sm text-muted">{COPY.hint}</p>
      </div>
      {RATING_FIELDS.map((field) => (
        <KioskRatingField key={field} name={field} legend={FIELD_COPY.fields[field]} />
      ))}
      <FormSubmit
        error={state?.status === "error" ? state.message : null}
        isPending={isPending}
        copy={{ submit: COPY.submit, pending: COPY.pending }}
      />
    </Form>
  );
}

function Overlay({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 overflow-y-auto bg-background p-6"
    >
      <div className="mx-auto grid w-full max-w-xl gap-6 py-6">{children}</div>
    </div>
  );
}

function takeIncoming(_current: PendingVisitView | null, incoming: PendingVisitView | null): PendingVisitView | null {
  return incoming;
}

"use client";

import { Form } from "@heroui/react";
import { useActionState } from "react";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { SelfEntryAvailability } from "@features/tournament/lib/types";
import { PendingButton } from "@shared/components/pending-button";
import { useErrorToast } from "@shared/hooks/use-error-toast";
import { formatEventDate } from "@shared/lib/date-time";

interface SelfEntryState {
  status: "done" | "error";
  message: string;
}

interface SelfEntryPanelProps {
  availability: SelfEntryAvailability;
  /** When the list opens, for the "notOpen" state; it comes from `event_settings` through the page. */
  registrationOpensAt: string;
  /** The Server Action of the feature; the page passes it, as the passport does with its other actions. */
  action: () => Promise<SelfEntryState>;
}

const COPY = TOURNAMENT_COPY.ui.entries.selfEntry;

/** The way into the tournament for a visitor who is not in it yet: the button, or the reason there is none. */
export function SelfEntryPanel({ availability, registrationOpensAt, action }: Readonly<SelfEntryPanelProps>) {
  return (
    <section
      aria-labelledby="self-entry-heading"
      className="flex w-full max-w-sm flex-col gap-3 border border-border p-4 text-center"
    >
      <h2 id="self-entry-heading" className="type-tiny text-muted">
        {COPY.heading}
      </h2>
      {availability === "open" ? (
        <EnrollForm action={action} />
      ) : (
        <p className="text-sm">{describeUnavailable(availability, registrationOpensAt)}</p>
      )}
    </section>
  );
}

function EnrollForm({ action }: Readonly<Pick<SelfEntryPanelProps, "action">>) {
  const [state, formAction, isPending] = useActionState(() => action(), null);

  useErrorToast(state?.status === "error" ? state.message : null, state);

  return (
    <Form action={formAction} className="flex flex-col items-center gap-3">
      <p className="text-sm">{COPY.prompt}</p>
      <PendingButton type="submit" variant="primary" className="min-h-11" isPending={isPending}>
        {isPending ? COPY.sending : COPY.submit}
      </PendingButton>
      {state?.status === "done" ? (
        <p role="status" className="text-sm">
          {state.message}
        </p>
      ) : null}
    </Form>
  );
}

function describeUnavailable(availability: Exclude<SelfEntryAvailability, "open">, registrationOpensAt: string) {
  if (availability === "notOpen") return COPY.notOpen(formatEventDate(registrationOpensAt, "numeric"));

  return COPY[availability];
}

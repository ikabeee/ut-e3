"use client";

import { AlertDialog, Button } from "@heroui/react";
import { useActionState, useEffect, useRef } from "react";
import type { DecisionOutcome } from "@features/raffle/lib/raffle-input";
import type { RaffleActionState } from "@features/raffle/lib/raffle-actions";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import type { PendingDraw } from "@features/raffle/lib/types";

export type RaffleAction = (previous: RaffleActionState | null, form: FormData) => Promise<RaffleActionState>;

interface DrawDecisionDialogProps {
  draw: PendingDraw;
  decide: RaffleAction;
  onDecided: (drawId: string) => void;
}

const COPY = RAFFLE_COPY.admin.decision;

/**
 * "Ganador" or "Descartado" (RF-51). The dialog cannot be dismissed: clicking outside or pressing Escape does nothing,
 * because the next spin waits for this answer.
 */
export function DrawDecisionDialog({ draw, decide, onDecided }: Readonly<DrawDecisionDialogProps>) {
  return (
    <AlertDialog.Backdrop isOpen isDismissable={false} isKeyboardDismissDisabled>
      <AlertDialog.Container placement="center" size="md">
        <AlertDialog.Dialog className="grid gap-4 rounded-none">
          <AlertDialog.Header>
            <AlertDialog.Heading className="type-section">{COPY.heading(draw.ticketNumber)}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body className="grid gap-2">
            <p className="m-0 type-mono text-3xl text-accent">{draw.gamertag}</p>
            <p className="m-0">{COPY.question}</p>
            <p className="m-0 text-sm text-muted">{COPY.hint}</p>
          </AlertDialog.Body>
          <AlertDialog.Footer className="flex flex-wrap gap-3">
            <DecisionForm draw={draw} outcome="winner" decide={decide} onDecided={onDecided} />
            <DecisionForm draw={draw} outcome="discarded" decide={decide} onDecided={onDecided} />
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

interface DecisionFormProps extends DrawDecisionDialogProps {
  outcome: DecisionOutcome;
}

function DecisionForm({ draw, outcome, decide, onDecided }: Readonly<DecisionFormProps>) {
  const [state, formAction, isPending] = useActionState(decide, null);
  const handledState = useRef<RaffleActionState | null>(null);

  // Each answer is handled once, although `onDecided` changes with every poll.
  useEffect(() => {
    if (state?.status !== "done" || handledState.current === state) return;

    handledState.current = state;
    onDecided(draw.id);
  }, [state, onDecided, draw.id]);

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="drawId" value={draw.id} />
      <input type="hidden" name="outcome" value={outcome} />
      <Button
        type="submit"
        variant={outcome === "winner" ? "primary" : "outline"}
        className="min-h-12 min-w-36"
        isPending={isPending}
      >
        {outcome === "winner" ? COPY.winner : COPY.discarded}
      </Button>
      {state?.status === "error" && (
        <p role="alert" className="m-0 text-sm text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}

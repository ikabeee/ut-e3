"use client";

import { Button } from "@heroui/react";
import { startTransition, useActionState, useEffect, useRef } from "react";
import type { SpinActionState } from "@features/raffle/lib/raffle-actions";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import type { PendingDraw } from "@features/raffle/lib/types";

export type SpinAction = (previous: SpinActionState | null, form: FormData) => Promise<SpinActionState>;

interface SpinButtonProps {
  spin: SpinAction;
  isDisabled: boolean;
  /** The ticket that came out, so the panel opens the decision without waiting for the next poll. */
  onDrawn: (draw: PendingDraw) => void;
}

const COPY = RAFFLE_COPY.admin.spin;

/**
 * "Girar". Each press carries its own request id (RNF-05): the id is kept until an answer arrives, so a request that is
 * retried after a lost connection returns the same ticket instead of drawing a second one (EC-08).
 */
export function SpinButton({ spin, isDisabled, onDrawn }: Readonly<SpinButtonProps>) {
  const [state, dispatch, isPending] = useActionState(spin, null);
  const requestId = useRef<string | null>(null);
  const handledState = useRef<SpinActionState | null>(null);

  // Each answer is handled once: `onDrawn` changes with every poll, and a ticket already decided must not come back.
  useEffect(() => {
    if (!state || handledState.current === state) return;

    handledState.current = state;
    requestId.current = null;

    if (state.status === "drawn") onDrawn(state.draw);
  }, [state, onDrawn]);

  function press() {
    requestId.current ??= crypto.randomUUID();

    const form = new FormData();

    form.set("requestId", requestId.current);
    startTransition(() => dispatch(form));
  }

  return (
    <div className="grid justify-items-start gap-3">
      <Button
        variant="primary"
        size="lg"
        className="min-h-16 min-w-48 text-xl"
        isDisabled={isDisabled}
        isPending={isPending}
        onPress={press}
      >
        {isPending ? COPY.pending : COPY.label}
      </Button>
      {state?.status === "error" && (
        <p role="alert" className="m-0 text-sm text-danger">
          {state.message}
        </p>
      )}
    </div>
  );
}

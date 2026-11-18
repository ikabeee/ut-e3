"use client";

import { Button } from "@heroui/react";
import { useActionState, useState } from "react";
import { PendingButton } from "@shared/components/pending-button";
import { useErrorToast } from "@shared/hooks/use-error-toast";

/** What an action answers: a status and, when it failed, the message for the toast. */
type ActionState = { status: string; message?: string };

interface ConfirmActionFormProps<State extends ActionState> {
  action: (previous: State | null, form: FormData) => Promise<State>;
  /** The hidden field that tells the action which record the confirmation is about. */
  field: { name: string; value: string };
  labels: { trigger: string; prompt: string; confirm: string; cancel: string };
  triggerClassName?: string;
}

// What cannot be undone: the first press only asks, and the action runs on the second.
export function ConfirmActionForm<State extends ActionState>({
  action,
  field,
  labels,
  triggerClassName = "min-h-11",
}: Readonly<ConfirmActionFormProps<State>>) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);

  useErrorToast(state?.status === "error" ? state.message : null, state);

  if (!isConfirming) {
    return (
      <Button variant="tertiary" className={triggerClassName} onPress={() => setIsConfirming(true)}>
        {labels.trigger}
      </Button>
    );
  }

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name={field.name} value={field.value} />
      <p className="text-sm">{labels.prompt}</p>
      <div className="flex flex-wrap gap-3">
        <PendingButton type="submit" variant="danger" className="min-h-11" isPending={isPending}>
          {labels.confirm}
        </PendingButton>
        <Button variant="tertiary" className="min-h-11" onPress={() => setIsConfirming(false)}>
          {labels.cancel}
        </Button>
      </div>
    </form>
  );
}

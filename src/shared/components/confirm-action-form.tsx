"use client";

import { Button } from "@heroui/react";
import { useActionState, useState } from "react";

interface ConfirmActionFormProps<State extends { status: string }> {
  action: (previous: State | null, form: FormData) => Promise<State>;
  /** The hidden field that tells the action which record the confirmation is about. */
  field: { name: string; value: string };
  labels: { trigger: string; prompt: string; confirm: string; cancel: string };
  triggerClassName?: string;
}

function readError(state: { status: string } | null): string | null {
  if (state?.status !== "error" || !("message" in state)) return null;

  return typeof state.message === "string" ? state.message : null;
}

// What cannot be undone: the first press only asks, and the action runs on the second.
export function ConfirmActionForm<State extends { status: string }>({
  action,
  field,
  labels,
  triggerClassName = "min-h-11",
}: Readonly<ConfirmActionFormProps<State>>) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);
  const error = readError(state);

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
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="danger" className="min-h-11" isPending={isPending}>
          {labels.confirm}
        </Button>
        <Button variant="tertiary" className="min-h-11" onPress={() => setIsConfirming(false)}>
          {labels.cancel}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { FormFeedback } from "@shared/components/form-feedback";
import { PendingButton } from "@shared/components/pending-button";

export type RecoveryAction = (previous: ManagementActionState | null, form: FormData) => Promise<ManagementActionState>;

interface RecoveryActionFormProps {
  action: RecoveryAction;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "outline";
}

/** One button that runs one recovery action: what worked shows under it, and an error becomes a toast. */
export function RecoveryActionForm({
  action,
  label,
  pendingLabel,
  variant = "outline",
}: Readonly<RecoveryActionFormProps>) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="grid justify-items-start gap-2">
      <PendingButton type="submit" variant={variant} className="min-h-11" isPending={isPending}>
        {isPending ? pendingLabel : label}
      </PendingButton>
      <FormFeedback state={state} />
    </form>
  );
}

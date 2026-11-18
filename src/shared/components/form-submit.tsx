"use client";

import { PendingButton } from "@shared/components/pending-button";
import { useErrorToast } from "@shared/hooks/use-error-toast";

interface FormSubmitProps {
  /** What the last attempt answered, if it failed; it is shown as a toast. */
  error?: string | null;
  isPending: boolean;
  /** For a form that cannot be sent right now, such as a kiosk after the registration closed. */
  isDisabled?: boolean;
  copy: { submit: string; pending: string };
}

/**
 * The end of a form: the button that sends it, with a spinner while it waits. The error of the last attempt goes to a
 * toast (S7); it leaves while the next attempt is sent and comes back if the answer is the same error.
 */
export function FormSubmit({ error, isPending, isDisabled = false, copy }: Readonly<FormSubmitProps>) {
  useErrorToast(isPending ? null : error, isPending);

  return (
    <PendingButton type="submit" variant="primary" className="min-h-11" isPending={isPending} isDisabled={isDisabled}>
      {isPending ? copy.pending : copy.submit}
    </PendingButton>
  );
}

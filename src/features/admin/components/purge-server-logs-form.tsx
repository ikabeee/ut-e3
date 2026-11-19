"use client";

import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { FormFeedback } from "@shared/components/form-feedback";
import { PendingButton } from "@shared/components/pending-button";
import { useActionForm } from "@shared/hooks/use-action-form";

export type PurgeServerLogsAction = (
  previous: ManagementActionState | null,
  form: FormData,
) => Promise<ManagementActionState>;

const COPY = ADMIN_COPY.logs;

/** "Purgar ahora": deletes the server logs older than 30 days; the answer is a status, or a toast if it fails. */
export function PurgeServerLogsForm({ action }: Readonly<{ action: PurgeServerLogsAction }>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action, { resetOnDone: false });

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid justify-items-start gap-2">
      <PendingButton type="submit" variant="outline" className="min-h-11" isPending={isPending}>
        {isPending ? COPY.purging : COPY.purge}
      </PendingButton>
      <FormFeedback state={state} />
    </form>
  );
}

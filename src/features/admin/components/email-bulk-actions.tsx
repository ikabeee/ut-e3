"use client";

import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { EmailManagementAction } from "@features/admin/components/email-actions-types";
import { ConfirmActionForm } from "@shared/components/confirm-action-form";
import { FormFeedback } from "@shared/components/form-feedback";
import { PendingButton } from "@shared/components/pending-button";
import { useActionForm } from "@shared/hooks/use-action-form";

interface EmailBulkActionsProps {
  /** How many failed emails with a body the mass resend would queue; shown before the confirmation. */
  resendableFailed: number;
  resendFailedAction: EmailManagementAction;
  sendNowAction: EmailManagementAction;
}

const COPY = ADMIN_COPY.emails;

/** The two actions on the whole outbox: run the delivery now, and resend every failed email after confirming. */
export function EmailBulkActions({
  resendableFailed,
  resendFailedAction,
  sendNowAction,
}: Readonly<EmailBulkActionsProps>) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <SendNow action={sendNowAction} />
      <ResendFailed count={resendableFailed} action={resendFailedAction} />
    </div>
  );
}

function SendNow({ action }: Readonly<{ action: EmailManagementAction }>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action);

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid content-start gap-3">
      <p className="text-sm text-muted">{COPY.sendNow.lead}</p>
      <PendingButton type="submit" variant="primary" className="min-h-11 w-fit" isPending={isPending}>
        {isPending ? COPY.sendNow.sending : COPY.sendNow.button}
      </PendingButton>
      <FormFeedback state={state} />
    </form>
  );
}

function ResendFailed({ count, action }: Readonly<{ count: number; action: EmailManagementAction }>) {
  const lead = count === 0 ? COPY.resendFailed.none : COPY.resendFailed.lead(count);

  return (
    <div className="grid content-start gap-3">
      <p className="text-sm text-muted">{lead}</p>
      {count === 0 ? null : (
        <ConfirmActionForm
          action={action}
          field={{ name: "expectedCount", value: String(count) }}
          labels={{
            trigger: COPY.resendFailed.trigger,
            prompt: COPY.resendFailed.prompt(count),
            confirm: COPY.resendFailed.confirm,
            cancel: COPY.resendFailed.cancel,
          }}
        />
      )}
    </div>
  );
}

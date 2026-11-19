"use client";

import { Button } from "@heroui/react";
import { useActionState, useState } from "react";
import type { EmailManagementAction, EmailTextAction } from "@features/admin/components/email-actions-types";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { EmailRow, EmailTextState } from "@features/admin/lib/types";
import { FormFeedback } from "@shared/components/form-feedback";
import { PendingButton } from "@shared/components/pending-button";
import { useActionForm } from "@shared/hooks/use-action-form";
import { useErrorToast } from "@shared/hooks/use-error-toast";

interface EmailRowActionsProps {
  email: EmailRow;
  resendAction: EmailManagementAction;
  rebuildAction: EmailManagementAction;
  viewAction: EmailTextAction;
}

const COPY = ADMIN_COPY.emails;

/** What can be done with one email: read its text, put it back in the queue, or make it again once it was erased. */
export function EmailRowActions({ email, resendAction, rebuildAction, viewAction }: Readonly<EmailRowActionsProps>) {
  return (
    <div className="flex flex-wrap gap-3">
      {email.hasBody ? <ViewText emailId={email.id} action={viewAction} /> : null}
      {email.canResend ? (
        <IdForm emailId={email.id} action={resendAction} labels={[COPY.actions.resend, COPY.actions.resending]} />
      ) : null}
      {email.canRebuild ? (
        <IdForm emailId={email.id} action={rebuildAction} labels={[COPY.actions.rebuild, COPY.actions.rebuilding]} />
      ) : null}
    </div>
  );
}

interface IdFormProps {
  emailId: string;
  action: EmailManagementAction;
  labels: readonly [string, string];
}

function IdForm({ emailId, action, labels }: Readonly<IdFormProps>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action);

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid justify-items-start gap-2">
      <input type="hidden" name="emailId" value={emailId} />
      <PendingButton type="submit" variant="outline" className="min-h-11" isPending={isPending}>
        {isPending ? labels[1] : labels[0]}
      </PendingButton>
      <FormFeedback state={state} />
    </form>
  );
}

// Reading the text is audited by the action. The text stays until it is hidden or the page is left.
function ViewText({ emailId, action }: Readonly<{ emailId: string; action: EmailTextAction }>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [hidden, setHidden] = useState<EmailTextState | null>(null);

  useErrorToast(state?.status === "error" ? state.message : null, state);

  const shown = state?.status === "text" && state !== hidden ? state.text : null;

  return (
    <div className="grid w-full gap-2">
      <form action={formAction} className="flex flex-wrap gap-3">
        <input type="hidden" name="emailId" value={emailId} />
        <PendingButton type="submit" variant="outline" className="min-h-11" isPending={isPending}>
          {isPending ? COPY.actions.viewing : COPY.actions.view}
        </PendingButton>
        {shown === null ? null : (
          <Button variant="tertiary" className="min-h-11" onPress={() => setHidden(state)}>
            {COPY.actions.hide}
          </Button>
        )}
      </form>
      {shown === null ? null : (
        <pre className="max-h-96 overflow-auto border border-border p-3 text-sm wrap-break-word whitespace-pre-wrap">
          {shown}
        </pre>
      )}
    </div>
  );
}

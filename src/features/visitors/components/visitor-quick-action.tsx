"use client";

import { Form } from "@heroui/react";
import type { VisitorAdminActionState } from "@features/visitors/lib/visitors-admin-actions";
import { VISITORS_ADMIN_COPY } from "@features/visitors/lib/visitors-admin-copy";
import { ActionFormFooter } from "@shared/components/action-form-footer";
import { useActionForm } from "@shared/hooks/use-action-form";

export type VisitorAdminAction = (
  previous: VisitorAdminActionState | null,
  form: FormData,
) => Promise<VisitorAdminActionState>;

interface VisitorQuickActionProps {
  action: VisitorAdminAction;
  visitorId: string;
  label: string;
  hint: string;
}

/** A button on one passport with nothing to type: resend the email, send the link, remove the exclusion. */
export function VisitorQuickAction({ action, visitorId, label, hint }: Readonly<VisitorQuickActionProps>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action);

  return (
    <Form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid max-w-xl gap-2">
      <input type="hidden" name="visitorId" value={visitorId} />
      <p className="text-sm text-muted">{hint}</p>
      <ActionFormFooter
        state={state}
        isPending={isPending}
        copy={{ submit: label, pending: VISITORS_ADMIN_COPY.actions.pending }}
      />
    </Form>
  );
}

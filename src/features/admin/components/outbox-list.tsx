"use client";

import { Button } from "@heroui/react";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { ServerStatus, UndeliveredEmailRow } from "@features/admin/lib/types";
import { FormFeedback } from "@shared/components/form-feedback";
import { useActionForm } from "@shared/hooks/use-action-form";

export type OutboxAction = (previous: ManagementActionState | null, form: FormData) => Promise<ManagementActionState>;

interface OutboxListProps {
  outbox: ServerStatus["outbox"];
  emails: readonly UndeliveredEmailRow[];
  resendAction: OutboxAction;
}

const COPY = ADMIN_COPY.server;

/** The counts of the outbox and the emails that did not leave, each with "Reenviar" when it still has a body. */
export function OutboxList({ outbox, emails, resendAction }: Readonly<OutboxListProps>) {
  return (
    <section aria-labelledby="server-outbox-heading" className="grid gap-3" data-testid="server-outbox">
      <h2 id="server-outbox-heading" className="type-section">
        {COPY.outboxHeading}
      </h2>
      <p>{COPY.outboxSummary(outbox.sent, outbox.pending, outbox.failed)}</p>
      {emails.length === 0 ? <p className="text-sm text-muted">{COPY.outboxEmpty}</p> : null}
      <ul className="m-0 grid list-none gap-2 p-0">
        {emails.map((email) => (
          <li key={email.id} className="grid gap-2 border border-border p-3">
            <OutboxRow email={email} resendAction={resendAction} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function OutboxRow({ email, resendAction }: Readonly<{ email: UndeliveredEmailRow; resendAction: OutboxAction }>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(resendAction);

  return (
    <>
      <p className="text-sm wrap-break-word">
        <strong className={email.failed ? "text-danger" : "text-warning"}>
          {email.failed ? COPY.outboxFailed : COPY.outboxPending}
        </strong>{" "}
        {COPY.outboxRow(email.subject, email.to, email.attempts)}
        {email.lastError ? <span className="block type-tiny text-muted">{email.lastError}</span> : null}
      </p>
      {email.canResend ? (
        <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid justify-items-start gap-2">
          <input type="hidden" name="emailId" value={email.id} />
          <Button type="submit" variant="outline" className="min-h-11" isPending={isPending}>
            {isPending ? COPY.resending : COPY.resend}
          </Button>
          <FormFeedback state={state} />
        </form>
      ) : (
        <p className="type-tiny text-muted">{COPY.outboxNoBody}</p>
      )}
    </>
  );
}

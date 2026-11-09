"use client";

import { Description, Form, Label, TextArea, TextField } from "@heroui/react";
import type { BlocklistActionState } from "@features/visitors/lib/email-blocklist-actions";
import type { BlockedEmail } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { ConfirmActionForm } from "@shared/components/confirm-action-form";
import { ActionFormFooter } from "@shared/components/action-form-footer";
import { useActionForm } from "@shared/hooks/use-action-form";

type BlocklistAction = (previous: BlocklistActionState | null, form: FormData) => Promise<BlocklistActionState>;

interface EmailBlocklistAdminProps {
  emails: readonly BlockedEmail[];
  addAction: BlocklistAction;
  removeAction: BlocklistAction;
}

const COPY = VISITORS_COPY.blocklist;

/** The blocklist of team emails (RF-44): add several at once, remove one with a confirmation. */
export function EmailBlocklistAdmin({ emails, addAction, removeAction }: Readonly<EmailBlocklistAdminProps>) {
  return (
    <section aria-labelledby="email-blocklist-heading" className="grid gap-6">
      <div className="grid gap-2">
        <h2 id="email-blocklist-heading" className="type-section">
          {COPY.heading}
        </h2>
        <p className="text-sm text-muted">{COPY.lead}</p>
      </div>
      <AddEmailsForm action={addAction} />
      {emails.length === 0 ? (
        <p className="text-sm text-muted">{COPY.empty}</p>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0" data-testid="email-blocklist">
          {emails.map((entry) => (
            <li key={entry.email} className="grid gap-2 border border-border p-3 min-[561px]:grid-cols-[1fr_auto]">
              <span className="break-all">
                {entry.email}
                {entry.hasPassport ? <span className="block type-tiny text-danger">{COPY.hasPassport}</span> : null}
              </span>
              <ConfirmActionForm
                action={removeAction}
                field={{ name: "email", value: entry.email }}
                labels={{
                  trigger: COPY.remove,
                  prompt: COPY.confirmRemove(entry.email),
                  confirm: COPY.confirmRemoveAction,
                  cancel: COPY.cancel,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AddEmailsForm({ action }: Readonly<{ action: BlocklistAction }>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action);

  return (
    <Form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid max-w-xl gap-3">
      <TextField name="emails" isRequired>
        <Label>{COPY.field}</Label>
        <TextArea className="text-base" rows={3} />
        <Description>{COPY.lead}</Description>
      </TextField>
      <ActionFormFooter state={state} isPending={isPending} copy={{ submit: COPY.add, pending: COPY.adding }} />
    </Form>
  );
}

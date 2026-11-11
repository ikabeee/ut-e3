"use client";

import { Button, Form } from "@heroui/react";
import type { ReactNode } from "react";
import type { ManagementAction } from "@features/accounts/components/invite-account-form";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { FormFeedback } from "@shared/components/form-feedback";
import { useActionForm } from "@shared/hooks/use-action-form";

interface StandAdminFormProps {
  action: ManagementAction;
  submitLabel: string;
  /** A form that creates starts over once it worked; one that edits keeps what was saved. */
  clearsWhenDone: boolean;
  children: ReactNode;
}

const COPY = STANDS_COPY.admin;

/** The frame the forms of the sysadmin share: the fields, what the server answered and the submit button. */
export function StandAdminForm({ action, submitLabel, clearsWhenDone, children }: Readonly<StandAdminFormProps>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm<ManagementActionState>(action, {
    resetOnDone: clearsWhenDone,
  });

  return (
    <Form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid gap-4">
      {children}
      <FormFeedback state={state} />
      <Button type="submit" variant="primary" className="min-h-11 justify-self-start" isPending={isPending}>
        {isPending ? COPY.pending : submitLabel}
      </Button>
    </Form>
  );
}

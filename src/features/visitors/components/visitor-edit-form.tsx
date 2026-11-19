"use client";

import { FieldError, Form, Input, Label, TextField } from "@heroui/react";
import type { VisitorAdminAction } from "@features/visitors/components/visitor-quick-action";
import type { AdminVisitorRow } from "@features/visitors/lib/types";
import { VISITORS_ADMIN_COPY } from "@features/visitors/lib/visitors-admin-copy";
import { ActionFormFooter } from "@shared/components/action-form-footer";
import { useActionForm } from "@shared/hooks/use-action-form";

const COPY = VISITORS_ADMIN_COPY.actions.edit;

/** Corrects the name, gamertag and email of one passport; what was saved stays in the fields. */
export function VisitorEditForm({
  visitor,
  action,
}: Readonly<{ visitor: AdminVisitorRow; action: VisitorAdminAction }>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action, { resetOnDone: false });

  return (
    <Form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid max-w-xl gap-3">
      <input type="hidden" name="visitorId" value={visitor.id} />
      <EditField name="fullName" label={COPY.fullName} value={visitor.fullName} />
      <EditField name="gamertag" label={COPY.gamertag} value={visitor.gamertag} />
      <EditField name="email" label={COPY.email} value={visitor.email} type="email" />
      <ActionFormFooter state={state} isPending={isPending} copy={{ submit: COPY.submit, pending: COPY.pending }} />
    </Form>
  );
}

interface EditFieldProps {
  name: string;
  label: string;
  value: string;
  type?: "text" | "email";
}

function EditField({ name, label, value, type = "text" }: Readonly<EditFieldProps>) {
  return (
    <TextField name={name} type={type} defaultValue={value} isRequired>
      <Label>{label}</Label>
      <Input className="min-h-11 text-base" autoComplete="off" />
      <FieldError />
    </TextField>
  );
}

"use client";

import { Button, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useActionState } from "react";
import type { RegistrationState } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface RegistrationFormProps {
  action: (previous: RegistrationState | null, form: FormData) => Promise<RegistrationState>;
}

const COPY = VISITORS_COPY.form;

export function RegistrationForm({ action }: Readonly<RegistrationFormProps>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const handleSubmit = useSubmitKeepingValues(formAction);

  return (
    <Form
      action={formAction}
      onSubmit={handleSubmit}
      validationErrors={state?.fieldErrors}
      className="flex w-full max-w-sm flex-col gap-5"
    >
      <TextField name="fullName" defaultValue={state?.values?.fullName} isRequired>
        <Label>{COPY.fullNameLabel}</Label>
        <Input placeholder={COPY.fullNamePlaceholder} className="min-h-11 text-base" />
        <FieldError />
      </TextField>

      <TextField name="gamertag" defaultValue={state?.values?.gamertag} isRequired>
        <Label>{COPY.gamertagLabel}</Label>
        <Input placeholder={COPY.gamertagPlaceholder} className="min-h-11 text-base" />
        <FieldError />
      </TextField>

      <TextField name="email" type="email" defaultValue={state?.values?.email} isRequired>
        <Label>{COPY.emailLabel}</Label>
        <Input placeholder={COPY.emailPlaceholder} className="min-h-11 text-base" />
        <FieldError />
      </TextField>

      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" className="min-h-11" isPending={isPending}>
        {isPending ? COPY.pending : COPY.submit}
      </Button>
    </Form>
  );
}

"use client";

import { Button, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useActionState, useState, type FormEvent } from "react";
import type { RegistrationState } from "@features/visitors/lib/visitors-actions";
import { parseRegistrationInput, type RegistrationFieldErrors } from "@features/visitors/lib/registration-input";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface RegistrationFormProps {
  action: (previous: RegistrationState | null, form: FormData) => Promise<RegistrationState>;
}

const COPY = VISITORS_COPY.form;

export function RegistrationForm({ action }: Readonly<RegistrationFormProps>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const { clientErrors, handleSubmit } = useSpanishValidation(formAction);

  return (
    <Form
      action={formAction}
      onSubmit={handleSubmit}
      validationErrors={{ ...clientErrors, ...state?.fieldErrors }}
      validationBehavior="aria"
      className="flex w-full max-w-sm flex-col gap-5"
    >
      <RegistrationFields values={state?.values} />

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

// The browser messages are never shown: the fields are checked here in Spanish before the action runs.
function useSpanishValidation(formAction: (form: FormData) => void) {
  const [clientErrors, setClientErrors] = useState<RegistrationFieldErrors | null>(null);
  const keepValuesSubmit = useSubmitKeepingValues(formAction);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const parsed = parseRegistrationInput(new FormData(event.currentTarget));

    if (!parsed.ok) {
      event.preventDefault();
      setClientErrors(parsed.fieldErrors);

      return;
    }

    setClientErrors(null);
    keepValuesSubmit(event);
  }

  return { clientErrors, handleSubmit };
}

function RegistrationFields({ values }: Readonly<{ values: RegistrationState["values"] }>) {
  return (
    <>
      <TextField name="fullName" defaultValue={values?.fullName} isRequired>
        <Label>{COPY.fullNameLabel}</Label>
        <Input placeholder={COPY.fullNamePlaceholder} className="min-h-11 text-base" />
        <FieldError />
      </TextField>

      <TextField name="gamertag" defaultValue={values?.gamertag} isRequired>
        <Label>{COPY.gamertagLabel}</Label>
        <Input placeholder={COPY.gamertagPlaceholder} className="min-h-11 text-base" />
        <FieldError />
      </TextField>

      <TextField name="email" type="email" defaultValue={values?.email} isRequired>
        <Label>{COPY.emailLabel}</Label>
        <Input placeholder={COPY.emailPlaceholder} className="min-h-11 text-base" />
        <FieldError />
      </TextField>
    </>
  );
}

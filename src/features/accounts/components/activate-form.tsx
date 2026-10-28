"use client";

import { Button, Description, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useActionState } from "react";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { ActivationState } from "@features/accounts/lib/activation-actions";
import { MIN_PASSWORD_LENGTH } from "@features/accounts/lib/invitation-rules";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface ActivateFormProps {
  /** The token of the link; it goes back to the server in a hidden field, where it is checked. */
  token: string;
  action: (previous: ActivationState | null, form: FormData) => Promise<ActivationState>;
}

const COPY = ACCOUNTS_COPY.activate;

export function ActivateForm({ token, action }: Readonly<ActivateFormProps>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const handleSubmit = useSubmitKeepingValues(formAction);

  return (
    <Form action={formAction} onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <TextField name="password" type="password" autoComplete="new-password" isRequired>
        <Label>{COPY.passwordLabel}</Label>
        <Input className="min-h-11 text-base" />
        <Description>{COPY.hint(MIN_PASSWORD_LENGTH)}</Description>
        <FieldError />
      </TextField>
      <TextField name="confirmation" type="password" autoComplete="new-password" isRequired>
        <Label>{COPY.confirmationLabel}</Label>
        <Input className="min-h-11 text-base" />
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

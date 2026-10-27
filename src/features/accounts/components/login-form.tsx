"use client";

import { Button, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useActionState } from "react";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { SignInState } from "@features/accounts/lib/accounts-actions";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface LoginFormProps {
  action: (previous: SignInState | null, form: FormData) => Promise<SignInState>;
}

const COPY = ACCOUNTS_COPY.signIn;

export function LoginForm({ action }: Readonly<LoginFormProps>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const handleSubmit = useSubmitKeepingValues(formAction);

  return (
    <Form action={formAction} onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5">
      <TextField name="email" type="email" autoComplete="username" isRequired>
        <Label>{COPY.emailLabel}</Label>
        <Input className="min-h-11 text-base" />
        <FieldError />
      </TextField>
      <TextField name="password" type="password" autoComplete="current-password" isRequired>
        <Label>{COPY.credentialLabel}</Label>
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

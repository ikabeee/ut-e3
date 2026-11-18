"use client";

import { Form } from "@heroui/react";
import { useActionState } from "react";
import { PasswordField } from "@features/accounts/components/password-field";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { ActivationState } from "@features/accounts/lib/activation-actions";
import { MIN_PASSWORD_LENGTH } from "@features/accounts/lib/invitation-rules";
import { FormSubmit } from "@shared/components/form-submit";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface ActivateFormProps {
  /** The token of the link; it goes back to the server in a hidden field, where it is checked. */
  token: string;
  action: (previous: ActivationState | null, form: FormData) => Promise<ActivationState>;
  /** The labels and buttons; the activation of an account by default, the reset of a password otherwise. */
  copy?: PasswordFormCopy;
}

interface PasswordFormCopy {
  passwordLabel: string;
  confirmationLabel: string;
  hint: (minimum: number) => string;
  submit: string;
  pending: string;
}

export function ActivateForm({ token, action, copy = ACCOUNTS_COPY.activate }: Readonly<ActivateFormProps>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const handleSubmit = useSubmitKeepingValues(formAction);

  return (
    <Form action={formAction} onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <PasswordField
        name="password"
        label={copy.passwordLabel}
        autoComplete="new-password"
        hint={copy.hint(MIN_PASSWORD_LENGTH)}
      />
      <PasswordField name="confirmation" label={copy.confirmationLabel} autoComplete="new-password" />
      <FormSubmit error={state?.error} isPending={isPending} copy={copy} />
    </Form>
  );
}

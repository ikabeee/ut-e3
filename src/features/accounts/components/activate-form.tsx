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
}

const COPY = ACCOUNTS_COPY.activate;

export function ActivateForm({ token, action }: Readonly<ActivateFormProps>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const handleSubmit = useSubmitKeepingValues(formAction);

  return (
    <Form action={formAction} onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <PasswordField
        name="password"
        label={COPY.passwordLabel}
        autoComplete="new-password"
        hint={COPY.hint(MIN_PASSWORD_LENGTH)}
      />
      <PasswordField name="confirmation" label={COPY.confirmationLabel} autoComplete="new-password" />
      <FormSubmit error={state?.error} isPending={isPending} copy={COPY} />
    </Form>
  );
}

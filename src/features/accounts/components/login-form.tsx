"use client";

import { Form } from "@heroui/react";
import { useActionState } from "react";
import { EmailField } from "@features/accounts/components/email-field";
import { PasswordField } from "@features/accounts/components/password-field";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { FORGOT_PASSWORD_PATH } from "@features/accounts/lib/accounts-links";
import type { SignInState } from "@features/accounts/lib/accounts-actions";
import { FormSubmit } from "@shared/components/form-submit";
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
      <EmailField label={COPY.emailLabel} />
      <PasswordField name="password" label={COPY.credentialLabel} autoComplete="current-password" />
      <FormSubmit error={state?.error} isPending={isPending} copy={COPY} />
      <a href={FORGOT_PASSWORD_PATH} className="touch-target relative self-start link-wipe no-underline">
        {COPY.forgotPassword}
      </a>
    </Form>
  );
}

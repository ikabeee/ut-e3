"use client";

import { Form } from "@heroui/react";
import { useActionState } from "react";
import { EmailField } from "@features/accounts/components/email-field";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { ForgotPasswordState } from "@features/accounts/lib/password-reset-actions";
import { FormSubmit } from "@shared/components/form-submit";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface ForgotPasswordFormProps {
  action: (previous: ForgotPasswordState | null, form: FormData) => Promise<ForgotPasswordState>;
}

const COPY = ACCOUNTS_COPY.forgotPassword;

export function ForgotPasswordForm({ action }: Readonly<ForgotPasswordFormProps>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const handleSubmit = useSubmitKeepingValues(formAction);

  if (state?.status === "sent")
    return (
      <p role="status" className="max-w-sm text-center text-muted">
        {COPY.sent}
      </p>
    );

  return (
    <Form action={formAction} onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5">
      <EmailField label={COPY.emailLabel} />
      <FormSubmit error={state?.error} isPending={isPending} copy={COPY} />
    </Form>
  );
}

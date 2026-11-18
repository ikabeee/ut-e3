"use client";

import { FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useActionState } from "react";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { LoginCodeState } from "@features/accounts/lib/login-code-actions";
import { FormSubmit } from "@shared/components/form-submit";
import { PendingButton } from "@shared/components/pending-button";
import { useErrorToast } from "@shared/hooks/use-error-toast";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface LoginCodeFormProps {
  verifyAction: (previous: LoginCodeState | null, form: FormData) => Promise<LoginCodeState>;
  resendAction: () => Promise<LoginCodeState>;
}

const COPY = ACCOUNTS_COPY.verifyCode;

export function LoginCodeForm({ verifyAction, resendAction }: Readonly<LoginCodeFormProps>) {
  const [state, formAction, isPending] = useActionState(verifyAction, null);
  const handleSubmit = useSubmitKeepingValues(formAction);

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <Form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} isRequired>
          <Label>{COPY.codeLabel}</Label>
          <Input className="min-h-11 text-base tracking-widest" />
          <FieldError />
        </TextField>
        <FormSubmit error={state?.error} isPending={isPending} copy={COPY} />
      </Form>
      <ResendCode resendAction={resendAction} />
    </div>
  );
}

function ResendCode({ resendAction }: Readonly<Pick<LoginCodeFormProps, "resendAction">>) {
  const [state, formAction, isPending] = useActionState(resendAction, null);

  useErrorToast(state?.error, state);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state?.notice ? <p role="status">{state.notice}</p> : null}
      <PendingButton type="submit" variant="outline" className="min-h-11" isPending={isPending}>
        {COPY.resend}
      </PendingButton>
    </form>
  );
}

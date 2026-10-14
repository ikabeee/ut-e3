"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Description, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { confirmEmailAndSetPasswordAction } from "@features/auth/lib/auth-actions";
import { AUTH_COPY } from "@features/auth/lib/auth-copy";
import { LOGIN_PATH } from "@features/auth/lib/auth-links";
import { ActionButton } from "@shared/components/action-button";
import { PaperCard } from "@shared/components/paper-card";
import { useServerActionForm } from "@shared/hooks/use-server-action-form";

interface ConfirmPasswordFormProps {
  token: string;
  fullName?: string;
  email?: string;
  action?: typeof confirmEmailAndSetPasswordAction;
}

export function ConfirmPasswordForm({
  token,
  fullName,
  email,
  action = confirmEmailAndSetPasswordAction,
}: Readonly<ConfirmPasswordFormProps>) {
  const copy = AUTH_COPY.confirmPassword;
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useServerActionForm(action, () => {
    setIsSuccess(true);
  });

  if (isSuccess) {
    return (
      <PaperCard className="w-full max-w-[500px] gap-6 p-[clamp(24px,4vw,36px)]">
        <div className="flex flex-col gap-2">
          <h1 className="font-wide text-2xl font-bold tracking-[-.03em] uppercase">{copy.successHeading}</h1>
          <Alert status="success">
            <Alert.Content>
              <Alert.Description>{copy.successMessage}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
        <div className="pt-2">
          <Link
            href={LOGIN_PATH}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-semibold"
          >
            {AUTH_COPY.confirmEmail.goToLogin}
          </Link>
        </div>
      </PaperCard>
    );
  }

  return (
    <PaperCard className="w-full max-w-[500px] gap-6 p-[clamp(24px,4vw,36px)]">
      <div className="flex flex-col gap-2">
        <h1 className="font-wide text-2xl font-bold tracking-[-.03em] uppercase">{copy.title}</h1>
        <p className="m-0 text-[14px] leading-[1.4] text-paper-foreground/80">{copy.description(fullName, email)}</p>
      </div>

      <Form onSubmit={form.submit} validationErrors={form.fieldErrors} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />

        <TextField name="password" isRequired className="flex flex-col gap-1">
          <Label className="text-paper-foreground">{copy.passwordLabel}</Label>
          <Input type="password" autoComplete="new-password" onInput={form.clearFieldError} className="text-base" />
          <Description className="text-paper-foreground/70">{copy.passwordHint}</Description>
          <FieldError />
        </TextField>

        <TextField name="confirmPassword" isRequired className="flex flex-col gap-1">
          <Label className="text-paper-foreground">{copy.confirmPasswordLabel}</Label>
          <Input type="password" autoComplete="new-password" onInput={form.clearFieldError} className="text-base" />
          <FieldError />
        </TextField>

        {form.error && Object.keys(form.fieldErrors).length === 0 ? (
          <p role="alert" className="m-0 text-sm font-medium text-danger">
            {form.error}
          </p>
        ) : null}

        <ActionButton type="submit" variant="primary" isPending={form.isPending} arrow="ne" className="mt-2">
          {form.isPending ? copy.submitting : copy.submitButton}
        </ActionButton>
      </Form>
    </PaperCard>
  );
}

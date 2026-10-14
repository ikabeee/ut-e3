"use client";

import { Alert, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { loginAction } from "@features/auth/lib/auth-actions";
import { AUTH_COPY } from "@features/auth/lib/auth-copy";
import { ActionButton } from "@shared/components/action-button";
import { PaperCard } from "@shared/components/paper-card";
import { useServerActionForm } from "@shared/hooks/use-server-action-form";

interface LoginFormProps {
  confirmed?: boolean;
}

export function LoginForm({ confirmed = false }: Readonly<LoginFormProps>) {
  const copy = AUTH_COPY.login;

  const form = useServerActionForm(loginAction, (data) => {
    window.location.href = data.redirectTo;
  });

  return (
    <PaperCard className="w-full max-w-[500px] gap-6 p-[clamp(24px,4vw,36px)]">
      <div className="flex flex-col gap-2">
        <h1 className="font-wide text-2xl font-bold tracking-[-.03em] uppercase">{copy.heading}</h1>
        <p className="m-0 text-[15px] leading-[1.4] text-paper-foreground/80">{copy.subheading}</p>
      </div>

      {confirmed ? (
        <Alert status="success">
          <Alert.Content>
            <Alert.Description>{copy.successConfirmed}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Form onSubmit={form.submit} validationErrors={form.fieldErrors} className="flex flex-col gap-4">
        <TextField name="identifier" isRequired className="flex flex-col gap-1">
          <Label className="text-paper-foreground">{copy.identifierLabel}</Label>
          <Input
            placeholder={copy.identifierPlaceholder}
            onInput={form.clearFieldError}
            autoCapitalize="none"
            spellCheck={false}
            autoComplete="username"
            className="text-base"
          />
          <FieldError />
        </TextField>

        <TextField name="password" isRequired className="flex flex-col gap-1">
          <Label className="text-paper-foreground">{copy.accountKeyLabel}</Label>
          <Input type="password" onInput={form.clearFieldError} autoComplete="current-password" className="text-base" />
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

      <div className="border-t border-paper-foreground/15 pt-4 text-center text-xs text-paper-foreground/70">
        {copy.noAccountPrompt}
      </div>
    </PaperCard>
  );
}

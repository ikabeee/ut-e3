"use client";

import { Button, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useActionState } from "react";
import type { RecoveryRequestState } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface RecoveryRequestFormProps {
  action: (previous: RecoveryRequestState | null, form: FormData) => Promise<RecoveryRequestState>;
}

const COPY = VISITORS_COPY.recovery;

// The answer after sending is always the same message (RF-68): the form never says whether the email has a passport.
export function RecoveryRequestForm({ action }: Readonly<RecoveryRequestFormProps>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const handleSubmit = useSubmitKeepingValues(formAction);
  const invalid = state?.status === "invalid" ? state : null;

  return (
    <Form
      action={formAction}
      onSubmit={handleSubmit}
      validationErrors={invalid ? { email: invalid.error } : undefined}
      className="flex w-full max-w-sm flex-col gap-5"
    >
      <TextField name="email" type="email" defaultValue={invalid?.email} isRequired>
        <Label>{COPY.emailLabel}</Label>
        <Input placeholder={COPY.emailPlaceholder} autoComplete="email" className="min-h-11 text-base" />
        <FieldError />
      </TextField>

      <Button type="submit" variant="primary" className="min-h-11" isPending={isPending}>
        {isPending ? COPY.pending : COPY.submit}
      </Button>

      {state?.status === "sent" ? (
        <p role="status" className="text-sm text-foreground">
          {COPY.sent}
        </p>
      ) : null}
    </Form>
  );
}

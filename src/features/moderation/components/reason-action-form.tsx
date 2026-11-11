"use client";

import { Description, FieldError, Form, Label, TextArea, TextField } from "@heroui/react";
import type { ModerationActionState } from "@features/moderation/lib/moderation-actions";
import { MODERATION_COPY } from "@features/moderation/lib/moderation-copy";
import { REASON_MAX_LENGTH, REASON_MIN_LENGTH } from "@features/moderation/lib/moderation-input";
import { ActionFormFooter } from "@shared/components/action-form-footer";
import { useActionForm } from "@shared/hooks/use-action-form";

export type ModerationAction = (
  previous: ModerationActionState | null,
  form: FormData,
) => Promise<ModerationActionState>;

interface ReasonActionFormProps {
  action: ModerationAction;
  /** The hidden field that names the check-in or the visitor. */
  target: { name: string; value: string };
  submitLabel: string;
}

const COPY = MODERATION_COPY.forms;

/** An annulment or an exclusion: nothing happens without a reason, and the reason goes to the audit log (RF-46). */
export function ReasonActionForm({ action, target, submitLabel }: Readonly<ReasonActionFormProps>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action);

  return (
    <Form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid max-w-xl gap-3">
      <input type="hidden" name={target.name} value={target.value} />
      <TextField name="reason" minLength={REASON_MIN_LENGTH} maxLength={REASON_MAX_LENGTH} isRequired>
        <Label>{COPY.reason}</Label>
        <TextArea className="text-base" rows={2} />
        <Description>{COPY.reasonHint}</Description>
        <FieldError />
      </TextField>
      <ActionFormFooter state={state} isPending={isPending} copy={{ submit: submitLabel, pending: COPY.pending }} />
    </Form>
  );
}

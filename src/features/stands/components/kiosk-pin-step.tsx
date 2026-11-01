"use client";

import { Description, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import type { RequestVisitState } from "@features/stands/lib/stands-actions";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { FormSubmit } from "@shared/components/form-submit";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface KioskPinStepProps {
  state: RequestVisitState | null;
  action: (form: FormData) => void;
  isPending: boolean;
}

const COPY = STANDS_COPY.kiosk.pin;

/** The first screen: the visitor types the PIN of the passport. A wrong one is told apart before the survey (RF-78). */
export function KioskPinStep({ state, action, isPending }: Readonly<KioskPinStepProps>) {
  const handleSubmit = useSubmitKeepingValues(action);

  return (
    <Form action={action} onSubmit={handleSubmit} className="grid w-full max-w-sm gap-5">
      <h2 className="type-section">{COPY.heading}</h2>
      <TextField name="pin" isRequired>
        <Label>{COPY.label}</Label>
        <Input
          className="min-h-14 text-center font-mono text-3xl tracking-widest"
          inputMode="numeric"
          maxLength={5}
          autoComplete="off"
        />
        <Description>{COPY.hint}</Description>
        <FieldError />
      </TextField>
      <FormSubmit error={state?.status === "error" ? state.message : null} isPending={isPending} copy={COPY} />
    </Form>
  );
}

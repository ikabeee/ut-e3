"use client";

import { useState } from "react";
import { Description, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import type { KioskRequestState } from "@features/stands/hooks/use-offline-kiosk";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { FormSubmit } from "@shared/components/form-submit";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface KioskPinStepProps {
  state: KioskRequestState | null;
  action: (form: FormData) => void;
  isPending: boolean;
}

const COPY = STANDS_COPY.kiosk.pin;

const PIN_LENGTH = 5;

/** The first screen: the visitor types the PIN of the passport. A wrong one is told apart before the survey (RF-78). */
export function KioskPinStep({ state, action, isPending }: Readonly<KioskPinStepProps>) {
  const handleSubmit = useSubmitKeepingValues(action);
  const [pin, setPin] = useState("");

  return (
    <Form action={action} onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-5">
      <h2 className="type-section">{COPY.heading}</h2>
      <TextField name="pin" isRequired value={pin} onChange={(value) => setPin(keepPinDigits(value))}>
        <Label>{COPY.label}</Label>
        <Input
          className="min-h-14 w-full min-w-0 text-center font-mono text-3xl tracking-widest"
          inputMode="numeric"
          autoComplete="off"
        />
        <Description>{COPY.hint}</Description>
        <FieldError />
      </TextField>
      <FormSubmit error={state?.status === "error" ? state.message : null} isPending={isPending} copy={COPY} />
    </Form>
  );
}

// Not maxLength: the browser cuts a pasted " 62192" to " 6219" before anyone can drop the space. Only digits are kept,
// up to the 5 of a PIN.
function keepPinDigits(value: string): string {
  return value.replaceAll(/\D/g, "").slice(0, PIN_LENGTH);
}

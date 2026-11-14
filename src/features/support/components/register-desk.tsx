"use client";

import { Button, Checkbox, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useActionState, useState } from "react";
import { AccessHandoff } from "@features/support/components/access-handoff";
import type { DeskRegistrationState } from "@features/support/lib/support-actions";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { FormSubmit } from "@shared/components/form-submit";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

type RegisterAction = (previous: DeskRegistrationState | null, form: FormData) => Promise<DeskRegistrationState>;

interface RegisterDeskProps {
  register: RegisterAction;
  /** Whether the KOF on-site sign-up is open right now: the page reads the hour, the form only shows the option. */
  canEnrollInTournament: boolean;
}

const COPY = SUPPORT_COPY.register;

/** Registers a visitor in person; once it is done, only the PIN and the access stay on screen until the next one. */
export function RegisterDesk({ register, canEnrollInTournament }: Readonly<RegisterDeskProps>) {
  const [round, setRound] = useState(0);

  return (
    <RegisterRound
      key={round}
      register={register}
      canEnrollInTournament={canEnrollInTournament}
      onFinished={() => setRound((current) => current + 1)}
    />
  );
}

// One visitor. A new key gives the next one an empty form and no PIN left on the screen.
function RegisterRound({
  register,
  canEnrollInTournament,
  onFinished,
}: Readonly<RegisterDeskProps & { onFinished: () => void }>) {
  const [state, action, isPending] = useActionState(register, null);
  const handleSubmit = useSubmitKeepingValues(action);

  if (state?.status === "registered") {
    return (
      <div className="grid max-w-xl gap-6">
        <RegisteredPassport registration={state} />
        <Button variant="outline" className="min-h-11" onPress={onFinished}>
          {COPY.result.newRegistration}
        </Button>
      </div>
    );
  }

  const fieldErrors = state?.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <Form action={action} onSubmit={handleSubmit} validationErrors={fieldErrors} className="grid w-full max-w-xl gap-5">
      <h2 className="type-section">{COPY.heading}</h2>
      <p className="m-0 text-sm text-muted">{COPY.hint}</p>
      <DeskField name="fullName" label={COPY.fullNameLabel} maxLength={80} />
      <DeskField name="gamertag" label={COPY.gamertagLabel} maxLength={20} />
      <DeskField name="email" label={COPY.emailLabel} type="email" maxLength={254} />
      {canEnrollInTournament ? (
        <Checkbox name="enrollInTournament" value="on" className="min-h-11">
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Content>
            <Label>{COPY.enrollLabel}</Label>
            <p className="m-0 text-sm text-muted">{COPY.enrollHint}</p>
          </Checkbox.Content>
        </Checkbox>
      ) : null}
      <FormSubmit error={state?.status === "error" ? state.message : null} isPending={isPending} copy={COPY} />
    </Form>
  );
}

interface DeskFieldProps {
  name: string;
  label: string;
  maxLength: number;
  type?: string;
}

function DeskField({ name, label, maxLength, type = "text" }: Readonly<DeskFieldProps>) {
  return (
    <TextField name={name} type={type} isRequired>
      <Label>{label}</Label>
      <Input className="min-h-11 text-base" autoComplete="off" autoCapitalize="off" maxLength={maxLength} />
      <FieldError />
    </TextField>
  );
}

function RegisteredPassport({
  registration,
}: Readonly<{ registration: Extract<DeskRegistrationState, { status: "registered" }> }>) {
  const { result } = COPY;

  return (
    <section aria-labelledby="registered-heading" className="grid gap-4 border border-border p-6">
      <h2 id="registered-heading" className="type-section">
        {result.heading}
      </h2>
      <p className="m-0 text-lg">
        {SUPPORT_COPY.recovery.result.visitorLine(registration.fullName, registration.gamertag)}
      </p>
      <div className="grid gap-1">
        <p className="m-0 type-tiny">{result.pinLabel}</p>
        <p className="m-0 font-mono text-4xl tracking-widest" data-testid="desk-pin">
          {registration.pin}
        </p>
        <p className="m-0 text-sm text-muted">{result.pinHint}</p>
      </div>
      <AccessHandoff claimPath={registration.claimPath} />
      <p className="m-0 text-sm text-muted">{result.instructions}</p>
      {registration.enrollment === "none" ? null : (
        <p role="status" className="m-0 text-sm">
          {result.enrollment[registration.enrollment]}
        </p>
      )}
    </section>
  );
}

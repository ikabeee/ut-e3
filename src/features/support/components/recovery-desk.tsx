"use client";

import { Button, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useActionState, useState } from "react";
import { RecoveryResult } from "@features/support/components/recovery-result";
import type { RecoveryState } from "@features/support/lib/support-actions";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { FormSubmit } from "@shared/components/form-submit";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

interface RecoveryDeskProps {
  recover: (previous: RecoveryState | null, form: FormData) => Promise<RecoveryState>;
}

const COPY = SUPPORT_COPY.recovery;

/** The form of the agent; once a passport is recovered, only the new access stays on screen until the next one. */
export function RecoveryDesk({ recover }: Readonly<RecoveryDeskProps>) {
  const [round, setRound] = useState(0);

  return <RecoveryRound key={round} recover={recover} onFinished={() => setRound((current) => current + 1)} />;
}

interface RecoveryRoundProps extends RecoveryDeskProps {
  onFinished: () => void;
}

// One visitor. A new key gives the next one an empty form and no access left on the screen.
function RecoveryRound({ recover, onFinished }: Readonly<RecoveryRoundProps>) {
  const [state, action, isPending] = useActionState(recover, null);
  const handleSubmit = useSubmitKeepingValues(action);

  if (state?.status === "recovered") {
    return (
      <div className="grid max-w-xl gap-6">
        <RecoveryResult recovery={state} />
        <Button variant="outline" className="min-h-11" onPress={onFinished}>
          {COPY.result.newRecovery}
        </Button>
      </div>
    );
  }

  return (
    <Form action={action} onSubmit={handleSubmit} className="grid w-full max-w-xl gap-5">
      <h2 className="type-section">{COPY.form.heading}</h2>
      <p className="m-0 text-sm text-muted">{COPY.form.hint}</p>
      <TextField name="fullName" isRequired>
        <Label>{COPY.form.fullNameLabel}</Label>
        <Input className="min-h-11 text-base" autoComplete="off" maxLength={120} />
        <FieldError />
      </TextField>
      <TextField name="gamertag" isRequired>
        <Label>{COPY.form.gamertagLabel}</Label>
        <Input className="min-h-11 text-base" autoComplete="off" autoCapitalize="off" maxLength={40} />
        <FieldError />
      </TextField>
      <FormSubmit error={state?.status === "error" ? state.message : null} isPending={isPending} copy={COPY.form} />
    </Form>
  );
}

"use client";

import { Button, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useActionState, useState } from "react";
import { RecoveryCandidates } from "@features/support/components/recovery-candidates";
import { RecoveryResult } from "@features/support/components/recovery-result";
import type { RecoveryState, SearchState } from "@features/support/lib/support-actions";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { FormSubmit } from "@shared/components/form-submit";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";

export interface RecoveryDeskProps {
  search: (previous: SearchState | null, form: FormData) => Promise<SearchState>;
  recover: (previous: RecoveryState | null, form: FormData) => Promise<RecoveryState>;
}

const COPY = SUPPORT_COPY.recovery;

/**
 * The desk of the agent: search with what the visitor remembers, compare the data of the passports that match with
 * the visitor, recover one. Once a passport is recovered, only the new access stays on screen until the next one.
 */
export function RecoveryDesk({ search, recover }: Readonly<RecoveryDeskProps>) {
  const [round, setRound] = useState(0);

  return <RecoveryRound key={round} search={search} recover={recover} onFinished={() => setRound(round + 1)} />;
}

// One visitor. A new key gives the next one an empty search and no access left on the screen.
function RecoveryRound({ search, recover, onFinished }: Readonly<RecoveryDeskProps & { onFinished: () => void }>) {
  const [searchState, searchAction, isSearching] = useActionState(search, null);
  const [recoverState, recoverAction, isRecovering] = useActionState(recover, null);

  if (recoverState?.status === "recovered") {
    return (
      <div className="grid max-w-xl gap-6">
        <RecoveryResult recovery={recoverState} />
        <Button variant="outline" className="min-h-11" onPress={onFinished}>
          {COPY.result.newRecovery}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-xl gap-8">
      <SearchForm
        action={searchAction}
        error={searchState?.status === "error" ? searchState.message : null}
        isPending={isSearching}
      />
      {searchState?.status === "found" ? (
        <RecoveryCandidates
          candidates={searchState.candidates}
          recoverAction={recoverAction}
          isRecovering={isRecovering}
          error={recoverState?.status === "error" ? recoverState.message : null}
        />
      ) : null}
    </div>
  );
}

interface SearchFormProps {
  action: (form: FormData) => void;
  error: string | null;
  isPending: boolean;
}

function SearchForm({ action, error, isPending }: Readonly<SearchFormProps>) {
  const handleSubmit = useSubmitKeepingValues(action);

  return (
    <Form action={action} onSubmit={handleSubmit} className="grid gap-5">
      <h2 className="type-section">{COPY.form.heading}</h2>
      <p className="m-0 text-sm text-muted">{COPY.form.hint}</p>
      <TextField name="query" isRequired>
        <Label>{COPY.form.queryLabel}</Label>
        <Input className="min-h-11 text-base" autoComplete="off" autoCapitalize="off" maxLength={120} />
        <FieldError />
      </TextField>
      <FormSubmit error={error} isPending={isPending} copy={COPY.form} />
    </Form>
  );
}

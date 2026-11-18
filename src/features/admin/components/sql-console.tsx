"use client";

import { Form, Input, Label, TextArea, TextField } from "@heroui/react";
import { useActionState, useState } from "react";
import { SqlResultTable } from "@features/admin/components/sql-result-table";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { SqlConsoleState } from "@features/admin/lib/types";
import { PendingButton } from "@shared/components/pending-button";
import { useErrorToast } from "@shared/hooks/use-error-toast";

export type SqlConsoleAction = (previous: SqlConsoleState | null, form: FormData) => Promise<SqlConsoleState>;

const COPY = ADMIN_COPY.sql;

/** One statement, run or reviewed with the same action; a write is applied only by the second form, typing CONFIRMAR. */
export function SqlConsole({ action }: Readonly<{ action: SqlConsoleAction }>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [sql, setSql] = useState("");

  useErrorToast(state?.status === "error" ? state.message : null, state);

  return (
    <section aria-labelledby="sql-console-heading" className="grid gap-6">
      <div className="grid gap-2">
        <h2 id="sql-console-heading" className="type-section">
          {COPY.heading}
        </h2>
        <p role="note" className="border border-warning p-3 text-sm">
          {COPY.warning}
        </p>
        <p className="text-sm text-muted">{COPY.lead}</p>
      </div>
      <Form action={formAction} className="grid max-w-3xl gap-3">
        <TextField name="sql" value={sql} onChange={setSql} isRequired>
          <Label>{COPY.label}</Label>
          <TextArea className="font-mono text-base" rows={6} spellCheck={false} autoCapitalize="off" />
        </TextField>
        <PendingButton type="submit" variant="primary" className="min-h-11 w-fit" isPending={isPending}>
          {COPY.run}
        </PendingButton>
      </Form>
      <SqlOutcome state={state} typedSql={sql} formAction={formAction} isPending={isPending} />
    </section>
  );
}

interface SqlOutcomeProps {
  state: SqlConsoleState | null;
  typedSql: string;
  formAction: (form: FormData) => void;
  isPending: boolean;
}

// Errors go to the toast; here goes what worked. A review stops being valid as soon as the text is edited.
function SqlOutcome({ state, typedSql, formAction, isPending }: Readonly<SqlOutcomeProps>) {
  if (!state || state.status === "error") return null;

  if (state.status === "done") return <p role="status">{state.message}</p>;

  if (state.status === "review") {
    if (state.statement !== typedSql.trim()) return null;

    return (
      <WriteReview statement={state.statement} message={state.message} formAction={formAction} isPending={isPending} />
    );
  }

  return (
    <div role="status" className="grid gap-3">
      <h3 className="type-mono">{COPY.resultHeading}</h3>
      <p className="text-sm">{state.message}</p>
      <SqlResultTable result={state.result} />
    </div>
  );
}

interface WriteReviewProps {
  statement: string;
  message: string;
  formAction: (form: FormData) => void;
  isPending: boolean;
}

function WriteReview({ statement, message, formAction, isPending }: Readonly<WriteReviewProps>) {
  return (
    <Form action={formAction} className="grid max-w-3xl gap-3 border border-danger p-4">
      <h3 className="type-mono">{COPY.reviewHeading}</h3>
      <p role="status">{message}</p>
      <input type="hidden" name="sql" value={statement} />
      <TextField name="confirmation" isRequired>
        <Label>{COPY.confirmationLabel}</Label>
        <Input className="min-h-11 text-base" autoComplete="off" />
      </TextField>
      <PendingButton type="submit" variant="danger" className="min-h-11 w-fit" isPending={isPending}>
        {COPY.confirm}
      </PendingButton>
    </Form>
  );
}

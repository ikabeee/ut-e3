"use client";

import { Button, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useActionState } from "react";
import type { EntriesActionState } from "@features/tournament/lib/entries-actions";
import { getEntryCounts, type EntryCounts } from "@features/tournament/lib/entries-view";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { MAX_ENTRANTS, PRE_LIST_LIMIT } from "@features/tournament/lib/tournament-rules";
import type { EntryView } from "@features/tournament/lib/types";
import { FormFeedback } from "@shared/components/form-feedback";
import { useActionForm } from "@shared/hooks/use-action-form";

export type EntriesAction = (previous: EntriesActionState | null, form: FormData) => Promise<EntriesActionState>;

export interface EntriesActions {
  add: EntriesAction;
  checkIn: EntriesAction;
  generate: EntriesAction;
}

interface EntriesPanelProps {
  entries: readonly EntryView[];
  /** Once the bracket exists the list is read-only: nobody can be added or checked in anymore. */
  hasBracket: boolean;
  actions: EntriesActions;
}

interface EntryField {
  name: string;
  label: string;
  submit: string;
  sending: string;
  inputMode?: "numeric";
  maxLength?: number;
}

const COPY = TOURNAMENT_COPY.ui.entries;

const ADD_FIELD: EntryField = { name: "gamertag", ...COPY.add };

const CHECK_IN_FIELD: EntryField = { name: "pin", ...COPY.checkIn, inputMode: "numeric", maxLength: 5 };

export function EntriesPanel({ entries, hasBracket, actions }: Readonly<EntriesPanelProps>) {
  return (
    <section aria-labelledby="entries-heading" className="grid gap-6">
      <h2 id="entries-heading" className="type-section">
        {COPY.heading}
      </h2>
      <EntryCountList counts={getEntryCounts(entries)} />
      {!hasBracket && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <EntryForm field={ADD_FIELD} action={actions.add} />
            <EntryForm field={CHECK_IN_FIELD} action={actions.checkIn} />
          </div>
          <GenerateForm action={actions.generate} />
        </>
      )}
      <EntryList entries={entries} />
    </section>
  );
}

function EntryCountList({ counts }: Readonly<{ counts: EntryCounts }>) {
  return (
    <ul aria-label={COPY.countsLabel} className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
      <CountItem value={counts.registered} label={COPY.counts.registered} />
      <CountItem value={counts.checkedIn} label={COPY.counts.checkedIn} />
      <CountItem value={counts.noShow} label={COPY.counts.noShow} />
      <li className="self-center type-tiny text-muted">{COPY.counts.preList(counts.preList, PRE_LIST_LIMIT)}</li>
      <li className="self-center type-tiny text-muted">{COPY.counts.places(counts.places, MAX_ENTRANTS)}</li>
    </ul>
  );
}

function CountItem({ value, label }: Readonly<{ value: number; label: string }>) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="font-mono text-xl font-bold tabular-nums">{value}</span>
      <span className="type-tiny text-muted">{label}</span>
    </li>
  );
}

function EntryForm({ field, action }: Readonly<{ field: EntryField; action: EntriesAction }>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action);

  return (
    <Form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid content-start gap-3">
      <TextField name={field.name} isRequired>
        <Label>{field.label}</Label>
        <Input
          className="min-h-11 text-base"
          inputMode={field.inputMode}
          maxLength={field.maxLength}
          autoComplete="off"
        />
        <FieldError />
      </TextField>
      <FormFeedback state={state} />
      <Button type="submit" variant="primary" className="min-h-11 justify-self-start" isPending={isPending}>
        {isPending ? field.sending : field.submit}
      </Button>
    </Form>
  );
}

function GenerateForm({ action }: Readonly<{ action: EntriesAction }>) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="grid content-start gap-3 border border-border p-4">
      <h3 className="type-mono font-bold">{COPY.generate.heading}</h3>
      <p className="text-sm text-muted">{COPY.generate.hint}</p>
      <FormFeedback state={state} />
      <Button type="submit" variant="outline" className="min-h-11 justify-self-start" isPending={isPending}>
        {isPending ? COPY.generate.sending : COPY.generate.submit}
      </Button>
    </form>
  );
}

function EntryList({ entries }: Readonly<{ entries: readonly EntryView[] }>) {
  if (entries.length === 0) return <p className="type-mono text-muted">{COPY.empty}</p>;

  return (
    <ul className="m-0 grid list-none gap-2 p-0 md:grid-cols-2">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between gap-3 border border-border p-3">
          <span className="font-bold">{entry.gamertag}</span>
          <span className="type-tiny text-muted">
            {COPY.channels[entry.channel]} · {COPY.statuses[entry.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}

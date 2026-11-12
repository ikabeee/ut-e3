"use client";

import { Button, Description, FieldError, Label, TextArea, TextField } from "@heroui/react";
import Link from "next/link";
import { startTransition, useActionState, useRef, type FormEvent } from "react";
import type { ModerationAction } from "@features/moderation/components/reason-action-form";
import { MODERATION_COPY } from "@features/moderation/lib/moderation-copy";
import { REASON_MAX_LENGTH, REASON_MIN_LENGTH } from "@features/moderation/lib/moderation-input";
import { useVisitSelection } from "@features/moderation/hooks/use-visit-selection";
import type { SelectableVisit } from "@features/moderation/lib/selectable-visit";
import { FormFeedback } from "@shared/components/form-feedback";

interface SelectionModerationFormProps {
  visits: readonly SelectableVisit[];
  action: ModerationAction;
}

const COPY = MODERATION_COPY.selection;

/**
 * A list of visits with a checkbox each and one reason for all: annuls the ticked visits or excludes their visitors
 * (RF-46). The button that was pressed goes to the action as `intent`.
 */
export function SelectionModerationForm({ visits, action }: Readonly<SelectionModerationFormProps>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const { selected, toggle, toggleAll } = useVisitSelection(visits.map((visit) => visit.checkInId));
  const intent = useRef("annul");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    form.set("intent", intent.current);
    startTransition(() => formAction(form));
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="grid gap-3">
      <fieldset className="m-0 grid gap-2 border-0 p-0">
        <legend className="type-tiny">{COPY.legend}</legend>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5"
            checked={selected.size === visits.length}
            onChange={(event) => toggleAll(event.target.checked)}
          />
          {COPY.selectAll}
        </label>
        <ul className="m-0 grid list-none gap-2 p-0">
          {visits.map((visit) => (
            <VisitRow key={visit.checkInId} visit={visit} isChecked={selected.has(visit.checkInId)} onToggle={toggle} />
          ))}
        </ul>
      </fieldset>
      <p className="type-tiny text-muted">{COPY.selected(selected.size)}</p>
      <ReasonField />
      <FormFeedback state={state} />
      <SubmitButtons onChoose={(choice) => (intent.current = choice)} isPending={isPending} />
    </form>
  );
}

function SubmitButtons({ onChoose, isPending }: Readonly<{ onChoose: (choice: string) => void; isPending: boolean }>) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="submit"
        variant="primary"
        className="min-h-11"
        isPending={isPending}
        onPress={() => onChoose("annul")}
      >
        {COPY.annul}
      </Button>
      <Button
        type="submit"
        variant="outline"
        className="min-h-11"
        isPending={isPending}
        onPress={() => onChoose("exclude")}
      >
        {COPY.exclude}
      </Button>
    </div>
  );
}

function ReasonField() {
  return (
    <TextField
      name="reason"
      minLength={REASON_MIN_LENGTH}
      maxLength={REASON_MAX_LENGTH}
      isRequired
      className="max-w-xl"
    >
      <Label>{MODERATION_COPY.forms.reason}</Label>
      <TextArea className="text-base" rows={2} />
      <Description>{COPY.reasonHint}</Description>
      <FieldError />
    </TextField>
  );
}

interface VisitRowProps {
  visit: SelectableVisit;
  isChecked: boolean;
  onToggle: (id: string) => void;
}

function VisitRow({ visit, isChecked, onToggle }: Readonly<VisitRowProps>) {
  return (
    <li
      className="flex flex-wrap items-center justify-between gap-3 border border-border p-3"
      data-testid="selectable-visit"
    >
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="checkInId"
          value={visit.checkInId}
          className="size-5"
          checked={isChecked}
          onChange={() => onToggle(visit.checkInId)}
        />
        <span>
          {visit.title}
          <span className="block type-tiny text-muted">{visit.detail}</span>
        </span>
      </label>
      <Link href={visit.reviewHref} className="min-h-11 content-center link-wipe">
        {MODERATION_COPY.alerts.review}
      </Link>
    </li>
  );
}

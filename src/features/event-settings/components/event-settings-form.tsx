"use client";

import { Description, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useDismissibleErrors } from "@features/event-settings/hooks/use-dismissible-errors";
import type { EventSettingsFormState } from "@features/event-settings/lib/event-settings-actions";
import { EVENT_SETTINGS_COPY } from "@features/event-settings/lib/event-settings-copy";
import {
  THRESHOLD_MAX,
  type EditableEventSettings,
  type InstantField,
  type ThresholdField,
} from "@features/event-settings/lib/event-settings-input";
import { ActionFormFooter } from "@shared/components/action-form-footer";
import { useActionForm } from "@shared/hooks/use-action-form";
import { formatCancunDateTimeInput } from "@shared/lib/date-time";

export type EventSettingsAction = (
  previous: EventSettingsFormState | null,
  form: FormData,
) => Promise<EventSettingsFormState>;

interface EventSettingsFormProps {
  settings: EditableEventSettings;
  action: EventSettingsAction;
}

const COPY = EVENT_SETTINGS_COPY.admin;

const INSTANT_GROUPS: readonly { title: string; fields: readonly InstantField[] }[] = [
  { title: COPY.groups.event, fields: ["eventStartsAt", "eventEndsAt", "registrationOpensAt"] },
  {
    title: COPY.groups.kof,
    fields: [
      "kofRegistrationOpensAt",
      "kofCheckInStartsAt",
      "kofCheckInEndsAt",
      "kofOnsiteSignupStartsAt",
      "kofOnsiteSignupEndsAt",
      "kofBracketGeneratesAt",
    ],
  },
  { title: COPY.groups.visits, fields: ["itchOpensAt", "checkInCutoffAt", "raffleStartsAt"] },
];

const THRESHOLDS: readonly ThresholdField[] = ["fraudTopScoreCount", "fraudWindowMinutes", "fraudSingleVisitMax"];

/** The single row of event_settings as a form (RF-43); a refused save keeps what was typed. */
export function EventSettingsForm({ settings, action }: Readonly<EventSettingsFormProps>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action, { resetOnDone: false });
  const { visibleState, validationErrors } = useDismissibleErrors(state, formRef);

  return (
    <Form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      validationErrors={validationErrors}
      className="grid gap-8"
    >
      {INSTANT_GROUPS.map((group) => (
        <InstantGroup key={group.title} title={group.title} fields={group.fields} settings={settings} />
      ))}
      <MarketplaceGroup settings={settings} />
      <ThresholdGroup settings={settings} />
      <ActionFormFooter state={visibleState} isPending={isPending} copy={{ submit: COPY.save, pending: COPY.saving }} />
    </Form>
  );
}

function InstantGroup({
  title,
  fields,
  settings,
}: Readonly<{ title: string; fields: readonly InstantField[]; settings: EditableEventSettings }>) {
  return (
    <fieldset className="grid gap-5 border border-border p-4 min-[561px]:grid-cols-2">
      <legend className="px-2 type-mono">{title}</legend>
      {fields.map((field) => (
        <TextField
          key={field}
          name={field}
          type="datetime-local"
          defaultValue={formatCancunDateTimeInput(settings[field])}
          isRequired
        >
          <Label>{COPY.fields[field]}</Label>
          <Input className="min-h-11 text-base" />
          <Description>{COPY.timeZoneHint}</Description>
          <FieldError />
        </TextField>
      ))}
    </fieldset>
  );
}

function MarketplaceGroup({ settings }: Readonly<{ settings: EditableEventSettings }>) {
  return (
    <fieldset className="grid gap-5 border border-border p-4 min-[561px]:grid-cols-2">
      <legend className="px-2 type-mono">{COPY.groups.marketplace}</legend>
      <TextField
        name="marketplaceClosesAt"
        type="datetime-local"
        defaultValue={formatCancunDateTimeInput(settings.marketplaceClosesAt)}
        isRequired
      >
        <Label>{COPY.fields.marketplaceClosesAt}</Label>
        <Input className="min-h-11 text-base" />
        <Description>{COPY.timeZoneHint}</Description>
        <FieldError />
      </TextField>
      <TextField name="marketplaceFormUrl" type="url" defaultValue={settings.marketplaceFormUrl ?? ""}>
        <Label>{COPY.fields.marketplaceFormUrl}</Label>
        <Input className="min-h-11 text-base" />
        <Description>{COPY.hints.marketplaceFormUrl}</Description>
        <FieldError />
      </TextField>
    </fieldset>
  );
}

function ThresholdGroup({ settings }: Readonly<{ settings: EditableEventSettings }>) {
  return (
    <fieldset className="grid gap-5 border border-border p-4 min-[561px]:grid-cols-3">
      <legend className="px-2 type-mono">{COPY.groups.fraud}</legend>
      {THRESHOLDS.map((field) => (
        <TextField
          key={field}
          name={field}
          type="number"
          inputMode="numeric"
          defaultValue={String(settings[field])}
          isRequired
        >
          <Label>{COPY.fields[field]}</Label>
          <Input className="min-h-11 text-base" min={1} max={THRESHOLD_MAX} step={1} />
          {field === "fraudTopScoreCount" ? <Description>{COPY.hints.fraudTopScoreCount}</Description> : null}
          <FieldError />
        </TextField>
      ))}
    </fieldset>
  );
}

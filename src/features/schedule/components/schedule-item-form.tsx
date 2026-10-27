"use client";

import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";
import { useActionState, useEffect, useRef } from "react";
import type { ScheduleFormState } from "@features/schedule/lib/schedule-actions";
import { SCHEDULE_COPY } from "@features/schedule/lib/schedule-copy";
import { DESCRIPTION_MAX_LENGTH, NO_ZONE, TITLE_MAX_LENGTH } from "@features/schedule/lib/schedule-item-input";
import type { ScheduleItem, ZoneOption } from "@features/schedule/lib/types";
import { useSubmitKeepingValues } from "@shared/hooks/use-submit-keeping-values";
import { formatCancunDateTimeInput } from "@shared/lib/date-time";

export type ScheduleAction = (previous: ScheduleFormState | null, form: FormData) => Promise<ScheduleFormState>;

interface ScheduleItemFormProps {
  item?: ScheduleItem;
  zones: readonly ZoneOption[];
  action: ScheduleAction;
}

const COPY = SCHEDULE_COPY.admin;

export function ScheduleItemForm({ item, zones, action }: Readonly<ScheduleItemFormProps>) {
  const [state, formAction, isPending] = useActionState(action, null);
  const handleSubmit = useSubmitKeepingValues(formAction);
  const formRef = useRef<HTMLFormElement>(null);

  // A new item starts over once it is saved; an edited item keeps what was saved.
  useEffect(() => {
    if (!item && state?.status === "saved") formRef.current?.reset();
  }, [item, state]);

  return (
    <Form
      ref={formRef}
      onSubmit={handleSubmit}
      validationErrors={state?.status === "invalid" ? state.errors : undefined}
      className="grid gap-5"
    >
      {item && <input type="hidden" name="id" value={item.id} />}
      <TextField name="title" defaultValue={item?.title} maxLength={TITLE_MAX_LENGTH} isRequired>
        <Label>{COPY.fields.title}</Label>
        <Input className="text-base" />
        <FieldError />
      </TextField>
      <TextField name="description" defaultValue={item?.description} maxLength={DESCRIPTION_MAX_LENGTH} isRequired>
        <Label>{COPY.fields.description}</Label>
        <TextArea className="text-base" rows={2} />
        <FieldError />
      </TextField>
      <div className="grid gap-5 min-[561px]:grid-cols-2">
        <DateTimeField name="startsAt" label={COPY.fields.startsAt} instant={item?.startsAt} />
        <DateTimeField name="endsAt" label={COPY.fields.endsAt} instant={item?.endsAt} />
      </div>
      <ZoneSelect zones={zones} defaultZone={item?.zone ?? NO_ZONE} />
      <FormFeedback state={state} isNew={!item} />
      <Button type="submit" variant="primary" className="min-h-11 justify-self-start" isPending={isPending}>
        {submitLabel(isPending, !item)}
      </Button>
    </Form>
  );
}

function DateTimeField({ name, label, instant }: Readonly<{ name: string; label: string; instant?: string }>) {
  return (
    <TextField
      name={name}
      type="datetime-local"
      defaultValue={instant ? formatCancunDateTimeInput(instant) : undefined}
      isRequired
    >
      <Label>{label}</Label>
      <Input className="text-base" />
      <Description>{COPY.timeZoneHint}</Description>
      <FieldError />
    </TextField>
  );
}

function ZoneSelect({ zones, defaultZone }: Readonly<{ zones: readonly ZoneOption[]; defaultZone: string }>) {
  return (
    <Select name="zone" defaultValue={defaultZone} className="max-w-sm">
      <Label>{COPY.fields.zone}</Label>
      <Select.Trigger className="min-h-11">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <FieldError />
      <Select.Popover>
        <ListBox>
          {[{ id: NO_ZONE, label: COPY.noZone }, ...zones].map((zone) => (
            <ListBox.Item key={zone.id} id={zone.id} textValue={zone.label}>
              {zone.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function FormFeedback({ state, isNew }: Readonly<{ state: ScheduleFormState | null; isNew: boolean }>) {
  if (state?.status === "saved") {
    return (
      <p role="status" className="text-sm text-success">
        {isNew ? COPY.created : COPY.updated}
      </p>
    );
  }

  if (state?.status === "error") {
    return (
      <p role="alert" className="text-sm text-danger">
        {state.message}
      </p>
    );
  }

  return null;
}

function submitLabel(isPending: boolean, isNew: boolean): string {
  if (isPending) return COPY.saving;

  return isNew ? COPY.create : COPY.update;
}

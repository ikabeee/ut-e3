"use client";

import { useActionState } from "react";
import { Button, Checkbox, FieldError, Form, Input, Label, TextArea, TextField } from "@heroui/react";
import { PixelMark } from "@features/studio/components/pixel-mark";
import { CONTACT_LIMITS, INITIAL_CONTACT_STATE } from "@features/studio/lib/contact-form";
import { STUDIO_COPY } from "@features/studio/lib/studio-copy";
import type { ContactErrors, ContactFormState } from "@features/studio/lib/types";

export type ContactAction = (previous: ContactFormState, form: FormData) => Promise<ContactFormState>;

const { contact } = STUDIO_COPY;

const LABEL_CLASSES = "type-tiny text-paper-foreground";

const FIELD_CLASSES =
  "min-h-11 w-full rounded-none border border-paper-rule bg-white px-4 py-3 font-mono text-base text-black placeholder:text-black/40 focus:border-accent data-[invalid=true]:border-danger";

const ERROR_CLASSES = "type-tiny text-danger";

/** The contact form, validated by its Server Action (`useActionState`). The page passes the action. */
export function ContactForm({ action }: Readonly<{ action: ContactAction }>) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_CONTACT_STATE);

  if (state.status === "sent") {
    return (
      <p role="status" className="m-0 flex items-start gap-3 type-wide text-[clamp(18px,2vw,26px)] leading-[1.2]">
        <PixelMark className="mt-1 text-accent-deep" />
        {state.message}
      </p>
    );
  }

  const errors: ContactErrors = state.status === "invalid" ? state.errors : {};

  return (
    <Form action={formAction} validationErrors={toValidationErrors(errors)} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ContactField name="email" label={contact.fields.email} type="email" autoComplete="email" />
        <ContactField name="name" label={contact.fields.name} autoComplete="name" maxLength={CONTACT_LIMITS.name} />
      </div>
      <ContactField
        name="organization"
        label={contact.fields.organization}
        autoComplete="organization"
        maxLength={CONTACT_LIMITS.organization}
        isOptional
      />
      <MessageField />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <ConsentCheckbox error={errors.consent} />
        <Button type="submit" variant="primary" className="min-h-11" isPending={isPending}>
          {contact.submit}
        </Button>
      </div>
    </Form>
  );
}

// HeroUI's Form takes a plain map from field name to message; fields without an error stay out.
function toValidationErrors(errors: ContactErrors): Record<string, string> {
  return Object.fromEntries(Object.entries(errors).filter(hasMessage));
}

function hasMessage(entry: [string, string | undefined]): entry is [string, string] {
  return Boolean(entry[1]);
}

interface ContactFieldProps {
  name: string;
  label: string;
  type?: string;
  autoComplete: string;
  maxLength?: number;
  isOptional?: boolean;
}

function ContactField({
  name,
  label,
  type = "text",
  autoComplete,
  maxLength,
  isOptional,
}: Readonly<ContactFieldProps>) {
  return (
    <TextField
      name={name}
      type={type}
      autoComplete={autoComplete}
      maxLength={maxLength}
      isRequired={!isOptional}
      className="grid gap-1.5"
    >
      <Label className={LABEL_CLASSES}>{label}</Label>
      <Input className={FIELD_CLASSES} />
      <FieldError className={ERROR_CLASSES} />
    </TextField>
  );
}

function MessageField() {
  return (
    <TextField
      name="message"
      isRequired
      minLength={CONTACT_LIMITS.minMessage}
      maxLength={CONTACT_LIMITS.message}
      className="grid gap-1.5"
    >
      <Label className={LABEL_CLASSES}>{contact.fields.message}</Label>
      <TextArea rows={5} className={`${FIELD_CLASSES} resize-y`} />
      <FieldError className={ERROR_CLASSES} />
    </TextField>
  );
}

function ConsentCheckbox({ error }: Readonly<{ error?: string }>) {
  return (
    <Checkbox name="consent" isRequired className="grid gap-1.5">
      <Checkbox.Content className="flex min-h-11 items-center gap-3">
        <Checkbox.Control className="rounded-none border-paper-foreground">
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Label className="text-sm text-paper-foreground">{contact.fields.consent}</Label>
      </Checkbox.Content>
      {error ? <p className={`m-0 ${ERROR_CLASSES}`}>{error}</p> : null}
    </Checkbox>
  );
}

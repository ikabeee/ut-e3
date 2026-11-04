import { STUDIO_COPY } from "@features/studio/lib/studio-copy";
import { readFormText } from "@shared/lib/form-data";
import type { ContactErrors, ContactFormState, ContactMessage } from "@features/studio/lib/types";

export const INITIAL_CONTACT_STATE: ContactFormState = { status: "idle" };

/** Field limits; the form also uses them as `maxLength`. */
export const CONTACT_LIMITS = {
  name: 80,
  organization: 120,
  message: 2000,
  minMessage: 10,
} as const;

const { errors: ERRORS } = STUDIO_COPY.contact;

export type ContactValidation = { ok: true; data: ContactMessage } | { ok: false; errors: ContactErrors };

/** Validates the contact form. The Server Action runs it: this is the validation that counts. */
export function validateContactForm(form: FormData): ContactValidation {
  const data = readContactMessage(form);

  const errors: ContactErrors = {
    email: isEmailAddress(data.email) ? undefined : ERRORS.email,
    name: checkName(data.name),
    organization: checkMaxLength(data.organization, CONTACT_LIMITS.organization),
    message: checkMessage(data.message),
    consent: form.has("consent") ? undefined : ERRORS.consent,
  };

  return Object.values(errors).some(Boolean) ? { ok: false, errors } : { ok: true, data };
}

/** An address shaped like `name@domain.ext`, without spaces (no regex, so no backtracking). */
export function isEmailAddress(value: string): boolean {
  const parts = value.split("@");

  if (parts.length !== 2 || /\s/.test(value)) {
    return false;
  }

  const [local, domain] = parts;
  const dot = domain.lastIndexOf(".");

  return local.length > 0 && dot > 0 && dot < domain.length - 1;
}

function readContactMessage(form: FormData): ContactMessage {
  return {
    email: readFormText(form, "email").trim(),
    name: readFormText(form, "name").trim(),
    organization: readFormText(form, "organization").trim(),
    message: readFormText(form, "message").trim(),
  };
}

function checkName(name: string): string | undefined {
  return name.length === 0 ? ERRORS.name : checkMaxLength(name, CONTACT_LIMITS.name);
}

function checkMessage(message: string): string | undefined {
  if (message.length < CONTACT_LIMITS.minMessage) {
    return ERRORS.messageTooShort(CONTACT_LIMITS.minMessage);
  }

  return checkMaxLength(message, CONTACT_LIMITS.message);
}

function checkMaxLength(value: string, max: number): string | undefined {
  return value.length > max ? ERRORS.tooLong(max) : undefined;
}

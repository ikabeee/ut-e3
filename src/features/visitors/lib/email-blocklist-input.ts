import { EMAIL_REGEX } from "@features/visitors/lib/registration-input";
import { readFormText } from "@shared/lib/form-data";

/** How many addresses one submission takes: a whole team pasted at once, with room to spare. */
export const MAX_EMAILS_PER_SUBMISSION = 50;

export type ParsedBlockedEmails =
  { isValid: true; emails: string[] } | { isValid: false; reason: "empty" | "invalid" | "tooMany"; invalid?: string };

/**
 * The addresses of the team members that may not register as visitors (RF-44). They come one per line or separated by
 * commas, and are kept in lower case without repeats.
 */
export function parseBlockedEmails(form: FormData): ParsedBlockedEmails {
  const emails = [
    ...new Set(
      readFormText(form, "emails")
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  if (emails.length === 0) return { isValid: false, reason: "empty" };

  if (emails.length > MAX_EMAILS_PER_SUBMISSION) return { isValid: false, reason: "tooMany" };

  const invalid = emails.find((email) => !EMAIL_REGEX.test(email));

  return invalid ? { isValid: false, reason: "invalid", invalid } : { isValid: true, emails };
}

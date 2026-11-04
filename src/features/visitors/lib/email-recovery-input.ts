import { EMAIL_REGEX } from "@features/visitors/lib/registration-input";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { readFormText } from "@shared/lib/form-data";

export type RecoveryEmailResult = { ok: true; email: string } | { ok: false; email: string; error: string };

// Same rules as the registration, so the email typed here is stored the same way (trimmed and lowercased).
export function parseRecoveryEmail(form: FormData): RecoveryEmailResult {
  const email = readFormText(form, "email").trim().toLowerCase();

  if (!email) return { ok: false, email, error: VISITORS_COPY.errors.emailRequired };

  if (email.length > 254 || !EMAIL_REGEX.test(email)) {
    return { ok: false, email, error: VISITORS_COPY.errors.emailInvalid };
  }

  return { ok: true, email };
}

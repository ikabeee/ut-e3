import { MIN_PASSWORD_LENGTH, validateNewPassword } from "@features/accounts/lib/invitation-rules";
import { readFormText, type ServerActionForm } from "@shared/lib/form-data";

interface PasswordErrors {
  tooShort: (minimum: number) => string;
  mismatch: string;
}

/** The message for a new password that cannot be used, or null when the form carries a valid one. */
export function findPasswordProblem(form: ServerActionForm, errors: PasswordErrors): string | null {
  const problem = validateNewPassword(readFormText(form, "password"), readFormText(form, "confirmation"));

  if (!problem) return null;

  return problem === "tooShort" ? errors.tooShort(MIN_PASSWORD_LENGTH) : errors.mismatch;
}

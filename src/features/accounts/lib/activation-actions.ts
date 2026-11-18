"use server";

import { redirect } from "next/navigation";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { LOGIN_PATH } from "@features/accounts/lib/accounts-links";
import { findPasswordProblem } from "@features/accounts/lib/password-form";
import { activateAccount } from "@features/accounts/lib/server/invitations";
import { readFormText } from "@shared/lib/form-data";

export interface ActivationState {
  error: string;
}

const ERRORS = ACCOUNTS_COPY.activate.errors;

// A Server Action is a public endpoint: the password is checked here, and the token against the database. A link that is
// unknown or already used gets the same answer, so it does not tell which tokens exist.
export async function activateAccountAction(
  _previous: ActivationState | null,
  form: FormData,
): Promise<ActivationState> {
  const problem = findPasswordProblem(form, ERRORS);

  if (problem) return { error: problem };

  const result = await activateAccount(readFormText(form, "token"), readFormText(form, "password"), new Date());

  if (result.status === "activated") redirect(LOGIN_PATH);

  return { error: result.status === "expired" ? ERRORS.expired : ERRORS.invalid };
}

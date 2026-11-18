"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { LOGIN_PATH } from "@features/accounts/lib/accounts-links";
import type { ActivationState } from "@features/accounts/lib/activation-actions";
import { looksLikeEmail } from "@features/accounts/lib/invitation-input";
import { findPasswordProblem } from "@features/accounts/lib/password-form";
import { requestPasswordReset, resetPassword } from "@features/accounts/lib/server/password-reset";
import { readFormText, type ServerActionForm } from "@shared/lib/form-data";
import { deliverQueuedEmail } from "@shared/lib/server/email-delivery";

export interface ForgotPasswordState {
  status: "sent" | "invalid";
  error: string;
}

const FORGOT = ACCOUNTS_COPY.forgotPassword;

const ERRORS = ACCOUNTS_COPY.resetPassword.errors;

/**
 * Asks for the reset link. Only the format of the email is checked before answering; the limit, the lookup and the email
 * run after the response (`after()`), so the answer and its timing are the same whether the email has an account or not.
 */
export async function requestPasswordResetAction(
  _previous: ForgotPasswordState | null,
  form: ServerActionForm,
): Promise<ForgotPasswordState> {
  const email = readFormText(form, "email").trim().toLowerCase();

  if (!looksLikeEmail(email)) return { status: "invalid", error: FORGOT.errors.emailInvalid };

  const requestedAt = new Date();

  after(() => sendResetEmailSafely(email, requestedAt));

  return { status: "sent", error: "" };
}

// A Server Action is a public endpoint: the password is checked here, and the token against the database. A link that is
// unknown or already used gets the same answer, so it does not tell which tokens exist.
export async function resetPasswordAction(
  _previous: ActivationState | null,
  form: ServerActionForm,
): Promise<ActivationState> {
  const problem = findPasswordProblem(form, ERRORS);

  if (problem) return { error: problem };

  const result = await resetPassword(readFormText(form, "token"), readFormText(form, "password"), new Date());

  if (result.status === "changed") redirect(LOGIN_PATH);

  return { error: result.status === "expired" ? ERRORS.expired : ERRORS.invalid };
}

async function sendResetEmailSafely(email: string, requestedAt: Date): Promise<void> {
  try {
    const emailId = await requestPasswordReset(email, requestedAt);

    if (emailId) await deliverQueuedEmail(emailId);
  } catch (cause) {
    // Only the message: the address must not reach the logs.
    const message = cause instanceof Error ? cause.message : "Unknown error";

    console.error(`Password reset request failed: ${message}`);
  }
}

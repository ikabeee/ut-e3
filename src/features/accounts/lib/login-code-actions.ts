"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { getHomePath, LOGIN_PATH, MY_ROLE_PATH } from "@features/accounts/lib/accounts-links";
import { resendLoginCode, verifyLoginCode } from "@features/accounts/lib/server/login-challenge";
import {
  clearLoginChallengeCookie,
  readLoginChallengeToken,
} from "@features/accounts/lib/server/login-challenge-cookie";
import { isFirstVerifiedLogin } from "@features/accounts/lib/server/my-role-queries";
import { readFormText, type ServerActionForm } from "@shared/lib/form-data";
import { deliverQueuedEmail } from "@shared/lib/server/email-delivery";
import { createSession } from "@shared/lib/server/session";

export interface LoginCodeState {
  error: string;
  /** What went well, such as the new code that was sent. */
  notice: string;
}

const { errors, resent } = ACCOUNTS_COPY.verifyCode;

const SIX_DIGITS = /^\d{6}$/;

// A Server Action is a public endpoint: the code is checked for its format here and against the database in
// verifyLoginCode. Without a challenge cookie there is nothing to verify, so the person starts again at /login.
export async function verifyLoginCodeAction(
  _previous: LoginCodeState | null,
  form: ServerActionForm,
): Promise<LoginCodeState> {
  const token = await readLoginChallengeToken();

  if (!token) redirect(LOGIN_PATH);

  const code = readFormText(form, "code").trim();

  if (!SIX_DIGITS.test(code)) return { error: errors.invalidFormat, notice: "" };

  const result = await verifyLoginCode(token, code, new Date());

  if (result.status === "invalid") return { error: errors.invalidCode, notice: "" };

  await clearLoginChallengeCookie();
  await createSession(result.accountId);

  // The first verified login of an account explains its role before the work screen (S4).
  redirect((await isFirstVerifiedLogin(result.accountId)) ? MY_ROLE_PATH : getHomePath(result.role));
}

export async function resendLoginCodeAction(): Promise<LoginCodeState> {
  const token = await readLoginChallengeToken();

  if (!token) redirect(LOGIN_PATH);

  const result = await resendLoginCode(token, new Date());

  if (result.status === "invalid") return { error: errors.expiredChallenge, notice: "" };

  if (result.status === "rateLimited") return { error: errors.tooManyCodes, notice: "" };

  after(() => deliverQueuedEmail(result.emailId));

  return { error: "", notice: resent };
}

"use server";

import { redirect } from "next/navigation";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { LOGIN_PATH, SYSADMIN_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { findSignInAccount } from "@features/accounts/lib/server/account-queries";
import { hashPassword, verifyPassword } from "@shared/lib/server/password";
import { isRateLimited, recordAttempt } from "@shared/lib/server/rate-limit";
import { createSession, deleteSession } from "@shared/lib/server/session";

export interface SignInState {
  error: string;
}

const SIGN_IN_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };

const { errors } = ACCOUNTS_COPY.signIn;

// Server Actions are public endpoints: the form fields are untrusted until checked here.
export async function signIn(_previous: SignInState | null, form: FormData): Promise<SignInState> {
  const email = readField(form, "email").trim().toLowerCase();
  const password = readField(form, "password");

  if (!email || !password) return { error: errors.missingFields };

  const attemptKey = `login:${email}`;

  if (await isRateLimited(attemptKey, SIGN_IN_LIMIT)) return { error: errors.tooManyAttempts };

  const accountId = await authenticate(email, password);

  if (!accountId) {
    await recordAttempt(attemptKey, SIGN_IN_LIMIT);

    return { error: errors.invalidCredentials };
  }

  await createSession(accountId);
  redirect(SYSADMIN_HOME_PATH);
}

export async function signOut(): Promise<void> {
  await deleteSession();
  redirect(LOGIN_PATH);
}

function readField(form: FormData, name: string): string {
  const value = form.get(name);

  return value instanceof File ? "" : (value ?? "");
}

// An unknown email still pays for one scrypt run, so the response time does not reveal which accounts exist.
async function authenticate(email: string, password: string): Promise<string | null> {
  const account = await findSignInAccount(email);
  const isValid = await verifyPassword(password, account?.password ?? (await getDecoyHash()));

  return account && isValid ? account.id : null;
}

let decoyHash: Promise<string> | undefined;

function getDecoyHash(): Promise<string> {
  decoyHash ??= hashPassword("decoy password for unknown accounts");

  return decoyHash;
}

"use server";

import { redirect } from "next/navigation";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { LOGIN_PATH, SYSADMIN_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { findSignInAccount } from "@features/accounts/lib/server/account-queries";
import { readFormText } from "@shared/lib/form-data";
import { hashPassword, verifyPassword } from "@shared/lib/server/password";
import { clearAttempts, consumeAttempt } from "@shared/lib/server/rate-limit";
import { createSession, deleteSession } from "@shared/lib/server/session";

export interface SignInState {
  error: string;
}

const SIGN_IN_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };

const { errors } = ACCOUNTS_COPY.signIn;

// Server Actions are public endpoints: the form fields are untrusted until checked here.
export async function signIn(_previous: SignInState | null, form: FormData): Promise<SignInState> {
  const email = readFormText(form, "email").trim().toLowerCase();
  const password = readFormText(form, "password");

  if (!email || !password) return { error: errors.missingFields };

  const attemptKey = `login:${email}`;

  if (!(await consumeAttempt(attemptKey, SIGN_IN_LIMIT))) return { error: errors.tooManyAttempts };

  const accountId = await authenticate(email, password);

  if (!accountId) return { error: errors.invalidCredentials };

  await clearAttempts(attemptKey);
  await createSession(accountId);
  redirect(SYSADMIN_HOME_PATH);
}

export async function signOut(): Promise<void> {
  await deleteSession();
  redirect(LOGIN_PATH);
}

// An unknown email still pays for one scrypt run, so the response time does not reveal which accounts exist.
async function authenticate(email: string, password: string): Promise<string | null> {
  const account = await findSignInAccount(email);
  const isValid = await verifyPassword(password, account?.password ?? (await getDecoyHash()));

  return account && isValid ? account.id : null;
}

let decoyHash: Promise<string> | undefined;

// A failed first run is forgotten, so one transient scrypt error does not break every later sign-in.
function getDecoyHash(): Promise<string> {
  if (!decoyHash) {
    decoyHash = hashPassword("decoy password for unknown accounts");
    decoyHash.catch(forgetDecoyHash);
  }

  return decoyHash;
}

function forgetDecoyHash(): void {
  decoyHash = undefined;
}

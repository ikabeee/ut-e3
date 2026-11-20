"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { LOGIN_PATH, LOGIN_VERIFY_PATH } from "@features/accounts/lib/accounts-links";
import { findSignInAccount } from "@features/accounts/lib/server/account-queries";
import { startLoginChallenge, type ChallengeAccount } from "@features/accounts/lib/server/login-challenge";
import { setLoginChallengeCookie } from "@features/accounts/lib/server/login-challenge-cookie";
import { readFormText, type ServerActionForm } from "@shared/lib/form-data";
import { deliverQueuedEmail } from "@shared/lib/server/email-delivery";
import { hashPassword, verifyPassword } from "@shared/lib/server/password";
import { deleteSession } from "@shared/lib/server/session";

export interface SignInState {
  error: string;
}

const { errors } = ACCOUNTS_COPY.signIn;

// The password alone opens no session: it starts the second step, the 6-digit code that is sent by email (S2).
// Server Actions are public endpoints: the form fields are untrusted until checked here.
export async function signIn(_previous: SignInState | null, form: ServerActionForm): Promise<SignInState> {
  const email = readFormText(form, "email").trim().toLowerCase();
  const password = readFormText(form, "password");

  if (!email || !password) return { error: errors.missingFields };

  const account = await authenticate(email, password);

  if (!account) return { error: errors.invalidCredentials };

  const challenge = await startLoginChallenge(account, new Date());

  await setLoginChallengeCookie(challenge.token);
  after(() => deliverQueuedEmail(challenge.emailId));
  redirect(LOGIN_VERIFY_PATH);
}

export async function signOut(): Promise<void> {
  await deleteSession();
  redirect(LOGIN_PATH);
}

// An unknown email still pays for one scrypt run, so the response time does not reveal which accounts exist.
async function authenticate(email: string, password: string): Promise<ChallengeAccount | null> {
  const account = await findSignInAccount(email);
  const isValid = await verifyPassword(password, account?.password ?? (await getDecoyHash()));

  return account && isValid ? { id: account.id, email: account.email, name: account.name } : null;
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

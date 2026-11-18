import "server-only";
import { cookies } from "next/headers";
import { CHALLENGE_LIFETIME_MS } from "@features/accounts/lib/server/login-challenge";

const LOGIN_CHALLENGE_COOKIE = "ut_login_challenge";

// Holds the token of the pending challenge between the password and the code; it opens nothing by itself.
export async function setLoginChallengeCookie(token: string): Promise<void> {
  (await cookies()).set(LOGIN_CHALLENGE_COOKIE, token, {
    httpOnly: true,
    // Safari drops Secure cookies on http://localhost, so development keeps them off.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + CHALLENGE_LIFETIME_MS),
  });
}

export async function readLoginChallengeToken(): Promise<string | undefined> {
  return (await cookies()).get(LOGIN_CHALLENGE_COOKIE)?.value || undefined;
}

export async function clearLoginChallengeCookie(): Promise<void> {
  (await cookies()).delete(LOGIN_CHALLENGE_COOKIE);
}

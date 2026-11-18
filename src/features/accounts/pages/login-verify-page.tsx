import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CenteredPage } from "@features/accounts/components/centered-page";
import { LoginCodeForm } from "@features/accounts/components/login-code-form";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { LOGIN_PATH, LOGIN_VERIFY_PATH } from "@features/accounts/lib/accounts-links";
import { resendLoginCodeAction, verifyLoginCodeAction } from "@features/accounts/lib/login-code-actions";
import { readLoginChallengeToken } from "@features/accounts/lib/server/login-challenge-cookie";

const COPY = ACCOUNTS_COPY.verifyCode;

export const loginVerifyPageMetadata: Metadata = {
  title: COPY.title,
  alternates: { canonical: LOGIN_VERIFY_PATH },
  robots: { index: false, follow: false },
};

export function LoginVerifyPage() {
  return (
    <Suspense>
      <LoginVerifyGate />
    </Suspense>
  );
}

// The challenge cookie is read at request time; without it the person has not passed the password step.
async function LoginVerifyGate() {
  if (!(await readLoginChallengeToken())) redirect(LOGIN_PATH);

  return (
    <CenteredPage title={COPY.title}>
      <p className="max-w-sm text-center text-muted">{COPY.description}</p>
      <LoginCodeForm verifyAction={verifyLoginCodeAction} resendAction={resendLoginCodeAction} />
      <a href={LOGIN_PATH} className="touch-target relative link-wipe no-underline">
        {COPY.backToLogin}
      </a>
    </CenteredPage>
  );
}

import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CenteredPage } from "@features/accounts/components/centered-page";
import { ActivateForm } from "@features/accounts/components/activate-form";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { FORGOT_PASSWORD_PATH, LOGIN_PATH } from "@features/accounts/lib/accounts-links";
import { resetPasswordAction } from "@features/accounts/lib/password-reset-actions";
import { getResetLinkState, type ResetLinkState } from "@features/accounts/lib/server/password-reset";

const COPY = ACCOUNTS_COPY.resetPassword;

export const resetPasswordPageMetadata: Metadata = {
  title: COPY.title,
  robots: { index: false, follow: false },
  // The token is in the address: it must not travel to another site in the Referer header.
  referrer: "no-referrer",
};

export function ResetPasswordPage({ params }: PageProps<"/reset-password/[token]">) {
  return (
    <Suspense>
      <ResetGate params={params} />
    </Suspense>
  );
}

// The state of the link depends on the clock and on the database, so it is resolved at request time.
async function ResetGate({ params }: Readonly<Pick<PageProps<"/reset-password/[token]">, "params">>) {
  await connection();

  const { token } = await params;
  const state = await resolveState(token);

  return (
    <CenteredPage title={COPY.title}>
      {state.status === "valid" ? (
        <>
          <p className="max-w-sm text-center text-muted">{COPY.greeting(state.name)}</p>
          <ActivateForm token={token} action={resetPasswordAction} copy={COPY} />
        </>
      ) : (
        <UnusableLink status={state.status} />
      )}
    </CenteredPage>
  );
}

function resolveState(token: string): Promise<ResetLinkState> {
  return getResetLinkState(token, new Date());
}

// Whoever lands here with a bad link can ask for another one or go back to the sign-in.
function UnusableLink({ status }: Readonly<{ status: "expired" | "invalid" }>) {
  const links = [
    { href: FORGOT_PASSWORD_PATH, label: COPY.requestAnother },
    { href: LOGIN_PATH, label: COPY.goToLogin },
  ];

  return (
    <>
      <p role="alert" className="max-w-sm text-center text-muted">
        {COPY.errors[status]}
      </p>
      {links.map(({ href, label }) => (
        <a key={href} href={href} className="touch-target relative link-wipe no-underline">
          {label}
        </a>
      ))}
    </>
  );
}

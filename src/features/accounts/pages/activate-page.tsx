import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ActivateForm } from "@features/accounts/components/activate-form";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { LOGIN_PATH } from "@features/accounts/lib/accounts-links";
import { activateAccountAction, type ActivationState } from "@features/accounts/lib/activation-actions";
import { getInvitationState, type InvitationState } from "@features/accounts/lib/server/invitations";

interface ActivateViewProps {
  state: InvitationState;
  token: string;
  action: (previous: ActivationState | null, form: FormData) => Promise<ActivationState>;
}

const COPY = ACCOUNTS_COPY.activate;

export const activatePageMetadata: Metadata = {
  title: COPY.title,
  robots: { index: false, follow: false },
  // The token is in the address: it must not travel to another site in the Referer header.
  referrer: "no-referrer",
};

export function ActivatePage({ params }: PageProps<"/activate/[token]">) {
  return (
    <Suspense>
      <ActivateGate params={params} />
    </Suspense>
  );
}

// The state of the link depends on the clock and on the database, so it is resolved at request time.
async function ActivateGate({ params }: Readonly<Pick<PageProps<"/activate/[token]">, "params">>) {
  await connection();

  const { token } = await params;

  return <ActivateView state={await resolveState(token)} token={token} action={activateAccountAction} />;
}

function resolveState(token: string): Promise<InvitationState> {
  return getInvitationState(token, new Date());
}

export function ActivateView({ state, token, action }: Readonly<ActivateViewProps>) {
  return (
    <main className="page-wrap flex min-h-svh flex-col items-center justify-center gap-8 py-16">
      <h1 className="type-section">{COPY.title}</h1>
      {state.status === "valid" ? (
        <>
          <p className="max-w-sm text-center text-muted">{COPY.greeting(state.name)}</p>
          <ActivateForm token={token} action={action} />
        </>
      ) : (
        <UnusableLink status={state.status} />
      )}
    </main>
  );
}

function UnusableLink({ status }: Readonly<{ status: "expired" | "invalid" }>) {
  return (
    <>
      <p role="alert" className="max-w-sm text-center text-muted">
        {status === "expired" ? COPY.errors.expired : COPY.errors.invalid}
      </p>
      <a href={LOGIN_PATH} className="touch-target relative link-wipe no-underline">
        {COPY.goToLogin}
      </a>
    </>
  );
}

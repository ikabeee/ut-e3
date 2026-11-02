import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { SignOutButton } from "@features/accounts/components/sign-out-button";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { SUPPORT_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { requireRecoveryAgent } from "@features/accounts/lib/server/current-account";
import { RecoveryDesk } from "@features/support/components/recovery-desk";
import { recoverPassportAction } from "@features/support/lib/support-actions";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";

const COPY = SUPPORT_COPY.recovery;

export const recoveryPageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: SUPPORT_HOME_PATH },
  robots: { index: false, follow: false },
};

export function RecoveryPage() {
  return (
    <main className="page-wrap grid gap-10 py-12">
      <Suspense fallback={<p className="type-mono text-muted">{COPY.loading}</p>}>
        <RecoveryPanel />
      </Suspense>
    </main>
  );
}

// Reads the session cookie, so it streams behind the Suspense boundary.
async function RecoveryPanel() {
  await connection();

  const account = await requireRecoveryAgent();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="type-section">{COPY.title}</h1>
          <p className="mt-2 text-sm text-muted">{COPY.signedInAs(account.name)}</p>
        </div>
        <SignOutButton action={signOut} />
      </header>
      <RecoveryDesk recover={recoverPassportAction} />
    </>
  );
}

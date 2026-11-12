import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountPageHeader } from "@features/accounts/components/account-page-header";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { SUPPORT_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { requireRecoveryAgent } from "@features/accounts/lib/server/current-account";
import { RecoveryDesk } from "@features/support/components/recovery-desk";
import { RegisterDesk } from "@features/support/components/register-desk";
import { recoverPassportAction, registerVisitorAtDeskAction } from "@features/support/lib/support-actions";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { getEntryWindow } from "@features/tournament/lib/entries-rules";
import { getEntrySchedule } from "@features/tournament/lib/server/entries-queries";

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
  const canEnrollInTournament = await isOnsiteSignupOpen();

  return (
    <>
      <AccountPageHeader title={COPY.title} signedInAs={COPY.signedInAs(account.name)} signOutAction={signOut} />
      <RecoveryDesk recover={recoverPassportAction} />
      <RegisterDesk register={registerVisitorAtDeskAction} canEnrollInTournament={canEnrollInTournament} />
    </>
  );
}

// The option to enter the visitor in the KOF only exists while the on-site sign-up lasts.
async function isOnsiteSignupOpen(): Promise<boolean> {
  return getEntryWindow(await getEntrySchedule(), new Date()) === "onsite";
}

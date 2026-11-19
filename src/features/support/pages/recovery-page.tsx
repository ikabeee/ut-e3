import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { StaffPageHeader } from "@features/accounts/components/staff-page-header";
import { SUPPORT_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { requireRecoveryAgent } from "@features/accounts/lib/server/current-account";
import { RecoveryDesk } from "@features/support/components/recovery-desk";
import { RegisterDesk } from "@features/support/components/register-desk";
import {
  recoverPassportAction,
  registerVisitorAtDeskAction,
  searchPassportsAction,
} from "@features/support/lib/support-actions";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { getEntryWindow } from "@features/tournament/lib/entries-rules";
import { getEntrySchedule } from "@features/tournament/lib/server/entries-queries";
import { PanelSkeleton } from "@shared/components/panel-skeleton";

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
      <Suspense fallback={<PanelSkeleton label={COPY.loading} layout="form" />}>
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
      <StaffPageHeader
        title={COPY.title}
        signedInAs={COPY.signedInAs(account.name)}
        roles={account.roles}
        area="secondary"
      />
      <RecoveryDesk search={searchPassportsAction} recover={recoverPassportAction} />
      <RegisterDesk register={registerVisitorAtDeskAction} canEnrollInTournament={canEnrollInTournament} />
    </>
  );
}

// The option to enter the visitor in the KOF only exists while the on-site sign-up lasts.
async function isOnsiteSignupOpen(): Promise<boolean> {
  return getEntryWindow(await getEntrySchedule(), new Date()) === "onsite";
}

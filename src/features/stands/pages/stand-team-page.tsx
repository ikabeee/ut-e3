import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountPageHeader } from "@features/accounts/components/account-page-header";
import { AccountsPanel } from "@features/accounts/components/accounts-panel";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { ACCOUNT_ACTIONS } from "@features/accounts/lib/management-action-set";
import { requireStandAdmin } from "@features/accounts/lib/server/current-account";
import { listStandAccounts } from "@features/accounts/lib/server/invitations";
import { StandAdminNav } from "@features/stands/components/stand-admin-nav";
import { STAND_TEAM_PATH } from "@features/stands/lib/stands-links";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";

const COPY = STANDS_COPY.team;

export const standTeamPageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: STAND_TEAM_PATH },
  robots: { index: false, follow: false },
};

export function StandTeamPage() {
  return (
    <main className="page-wrap grid gap-10 py-12">
      <Suspense fallback={<p className="type-mono text-muted">{COPY.loading}</p>}>
        <StandTeamPanel />
      </Suspense>
    </main>
  );
}

// Reads the session cookie, so it streams behind the Suspense boundary. The list is the one of the stand of the session.
async function StandTeamPanel() {
  await connection();

  const account = await requireStandAdmin();
  const staff = await listStandAccounts({ role: "stand_staff", standId: account.standId });

  return (
    <>
      <AccountPageHeader title={COPY.title} signedInAs={COPY.signedInAs(account.name)} signOutAction={signOut} />
      <StandAdminNav />
      <p className="text-sm text-muted">{COPY.hint}</p>
      <AccountsPanel heading={COPY.heading} actorRole={account.role} accounts={staff} actions={ACCOUNT_ACTIONS} />
    </>
  );
}

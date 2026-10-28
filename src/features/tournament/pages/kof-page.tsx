import type { Metadata } from "next";
import { Suspense } from "react";
import { SignOutButton } from "@features/accounts/components/sign-out-button";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { KOF_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { requireKofAccount, type KofAccount } from "@features/accounts/lib/server/current-account";
import { TournamentDashboard } from "@features/tournament/components/tournament-dashboard";
import { submitTournamentCommand } from "@features/tournament/lib/tournament-actions";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { getTournament } from "@features/tournament/lib/server/tournament-queries";

const COPY = TOURNAMENT_COPY.ui;

export const kofPageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: KOF_HOME_PATH },
  robots: { index: false, follow: false },
};

export function KofPage() {
  return (
    <main className="page-wrap grid gap-10 py-12">
      <Suspense fallback={<p className="type-mono text-muted">{COPY.loading}</p>}>
        <KofPanel />
      </Suspense>
    </main>
  );
}

// Reads the session cookie and the live bracket, so it streams behind the Suspense boundary.
async function KofPanel() {
  const account = await requireKofAccount();
  const tournament = await getTournament();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="type-section">{COPY.title}</h1>
          <p className="mt-2 text-sm text-muted">{COPY.signedInAs(account.name, getRoleLabel(account))}</p>
        </div>
        <SignOutButton action={signOut} />
      </header>
      <TournamentDashboard
        initial={tournament}
        viewer={{ role: account.role, desk: account.kofDesk }}
        action={submitTournamentCommand}
      />
    </>
  );
}

function getRoleLabel(account: KofAccount): string {
  return account.role === "kof_admin" ? COPY.roles.kof_admin : COPY.roles.kof_staff(account.kofDesk);
}

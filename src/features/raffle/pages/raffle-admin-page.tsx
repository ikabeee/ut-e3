import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountPageHeader } from "@features/accounts/components/account-page-header";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { RAFFLE_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { requireRaffleAdmin } from "@features/accounts/lib/server/current-account";
import { RaffleDashboard, type RaffleDashboardActions } from "@features/raffle/components/raffle-dashboard";
import {
  closeRaffleAction,
  decideDrawAction,
  registerPrizeAction,
  spinRaffleAction,
} from "@features/raffle/lib/raffle-actions";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import { RAFFLE_LIVE_PATH } from "@features/raffle/lib/raffle-links";
import { getRaffleAdminSnapshot } from "@features/raffle/lib/server/raffle-queries";
import { ActionLink } from "@shared/components/action-link";

const COPY = RAFFLE_COPY.admin;

export const raffleAdminPageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: RAFFLE_HOME_PATH },
  robots: { index: false, follow: false },
};

const ACTIONS: RaffleDashboardActions = {
  spin: spinRaffleAction,
  decide: decideDrawAction,
  close: closeRaffleAction,
  registerPrize: registerPrizeAction,
};

export function RaffleAdminPage() {
  return (
    <main className="page-wrap grid gap-10 py-12">
      <Suspense fallback={<p className="type-mono text-muted">{COPY.loading}</p>}>
        <RafflePanel />
      </Suspense>
    </main>
  );
}

// Reads the session cookie and the live raffle, so it streams behind the Suspense boundary.
async function RafflePanel() {
  await connection();

  const account = await requireRaffleAdmin();

  return (
    <>
      <AccountPageHeader title={COPY.title} signedInAs={COPY.signedInAs(account.name)} signOutAction={signOut} />
      <ActionLink href={RAFFLE_LIVE_PATH} variant="outline" className="justify-self-start" isExternal>
        {COPY.liveLink}
      </ActionLink>
      <RaffleDashboard initial={await loadSnapshot()} viewerId={account.id} actions={ACTIONS} />
    </>
  );
}

function loadSnapshot() {
  return getRaffleAdminSnapshot(new Date());
}

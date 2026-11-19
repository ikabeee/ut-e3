import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AreaLink } from "@features/accounts/components/area-link";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { RAFFLE_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { getOtherAreaLink } from "@features/accounts/lib/area-links";
import { requireRaffleAdmin } from "@features/accounts/lib/server/current-account";
import { AdminHeader } from "@features/admin/components/admin-header";
import { AdminSidebarLayout } from "@features/admin/components/admin-sidebar";
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
import { PanelSkeleton } from "@shared/components/panel-skeleton";
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
      <Suspense fallback={<PanelSkeleton label={COPY.loading} />}>
        <RafflePanel />
      </Suspense>
    </main>
  );
}

// Reads the session cookie and the live raffle, so it streams behind the Suspense boundary.
async function RafflePanel() {
  await connection();

  const account = await requireRaffleAdmin();
  const currentPath = account.role === "sysadmin" ? RAFFLE_HOME_PATH : null;

  return (
    <AdminSidebarLayout currentPath={currentPath}>
      <AdminHeader
        title={COPY.title}
        signedInAs={COPY.signedInAs(account.name, account.role === "sysadmin")}
        currentPath={currentPath}
        signOutAction={signOut}
      />
      <AreaLink link={getOtherAreaLink(account.roles, "secondary")} />
      <ActionLink href={RAFFLE_LIVE_PATH} variant="outline" className="justify-self-start" isExternal>
        {COPY.liveLink}
      </ActionLink>
      <RaffleDashboard initial={await loadSnapshot()} viewerId={account.id} actions={ACTIONS} />
    </AdminSidebarLayout>
  );
}

function loadSnapshot() {
  return getRaffleAdminSnapshot(new Date());
}

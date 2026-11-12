import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountsPanel } from "@features/accounts/components/accounts-panel";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { SYSADMIN_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { ACCOUNT_ACTIONS } from "@features/accounts/lib/management-action-set";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { listManagedAccounts } from "@features/accounts/lib/server/invitations";
import { AdminHeader } from "@features/admin/components/admin-header";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { getZoneLink } from "@features/floor-plan/lib/floor-plan-links";
import { ZONE_IDS } from "@features/floor-plan/lib/types";
import { ScheduleAdmin } from "@features/schedule/components/schedule-admin";
import { deleteScheduleItem, saveScheduleItem } from "@features/schedule/lib/schedule-actions";
import { getScheduleItems } from "@features/schedule/lib/server/schedule-queries";
import { StandsAdmin, type StandsAdminActions } from "@features/stands/components/stands-admin";
import { listAdminStands } from "@features/stands/lib/server/stand-admin-queries";
import {
  createStandAction,
  inviteStandAdminAction,
  updateStandAction,
} from "@features/stands/lib/stands-admin-actions";

export const adminPageMetadata: Metadata = {
  title: ADMIN_COPY.title,
  description: ADMIN_COPY.description,
  alternates: { canonical: SYSADMIN_HOME_PATH },
  robots: { index: false, follow: false },
};

const ZONE_OPTIONS = ZONE_IDS.map((id) => ({ id, label: getZoneLink(id)?.label ?? id }));

const STAND_ACTIONS: StandsAdminActions = {
  create: createStandAction,
  update: updateStandAction,
  inviteAdmin: inviteStandAdminAction,
  resend: ACCOUNT_ACTIONS.resend,
  disable: ACCOUNT_ACTIONS.disable,
  reactivate: ACCOUNT_ACTIONS.reactivate,
};

export function AdminPage() {
  return (
    <main className="page-wrap grid gap-10 py-12">
      <Suspense fallback={<p className="type-mono text-muted">{ADMIN_COPY.loading}</p>}>
        <SysadminPanel />
      </Suspense>
    </main>
  );
}

// Reads the session cookie, so it streams behind the Suspense boundary instead of blocking the static shell.
async function SysadminPanel() {
  await connection();

  const account = await requireSysadmin();
  const items = await getScheduleItems();

  return (
    <>
      <AdminHeader
        title={ADMIN_COPY.title}
        accountName={account.name}
        currentPath={SYSADMIN_HOME_PATH}
        signOutAction={signOut}
      />
      <AccountsPanel
        heading={ADMIN_COPY.accountsHeading}
        actorRole={account.role}
        accounts={await listManagedAccounts(account.role)}
        actions={ACCOUNT_ACTIONS}
      />
      <StandsAdmin stands={await listAdminStands()} actions={STAND_ACTIONS} />
      <ScheduleAdmin
        items={items}
        zones={ZONE_OPTIONS}
        saveAction={saveScheduleItem}
        deleteAction={deleteScheduleItem}
      />
    </>
  );
}

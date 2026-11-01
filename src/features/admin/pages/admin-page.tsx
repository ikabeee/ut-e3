import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountsPanel } from "@features/accounts/components/accounts-panel";
import { SignOutButton } from "@features/accounts/components/sign-out-button";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { SYSADMIN_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { ACCOUNT_ACTIONS } from "@features/accounts/lib/management-action-set";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { listManagedAccounts } from "@features/accounts/lib/server/invitations";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { getZoneLink } from "@features/floor-plan/lib/floor-plan-links";
import { ZONE_IDS } from "@features/floor-plan/lib/types";
import { ScheduleAdmin } from "@features/schedule/components/schedule-admin";
import { deleteScheduleItem, saveScheduleItem } from "@features/schedule/lib/schedule-actions";
import { getScheduleItems } from "@features/schedule/lib/server/schedule-queries";

export const adminPageMetadata: Metadata = {
  title: ADMIN_COPY.title,
  description: ADMIN_COPY.description,
  alternates: { canonical: SYSADMIN_HOME_PATH },
  robots: { index: false, follow: false },
};

const ZONE_OPTIONS = ZONE_IDS.map((id) => ({ id, label: getZoneLink(id)?.label ?? id }));

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
  const account = await requireSysadmin();
  const items = await getScheduleItems();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="type-section">{ADMIN_COPY.title}</h1>
          <p className="mt-2 text-sm text-muted">{ADMIN_COPY.signedInAs(account.name)}</p>
        </div>
        <SignOutButton action={signOut} />
      </header>
      <AccountsPanel
        heading={ADMIN_COPY.accountsHeading}
        actorRole={account.role}
        accounts={await listManagedAccounts(account.role)}
        actions={ACCOUNT_ACTIONS}
      />
      <ScheduleAdmin
        items={items}
        zones={ZONE_OPTIONS}
        saveAction={saveScheduleItem}
        deleteAction={deleteScheduleItem}
      />
    </>
  );
}

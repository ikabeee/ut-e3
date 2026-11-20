import { parseAccountFilter } from "@features/accounts/lib/account-admin-filter";
import {
  clearTwoFactorAction,
  closeSessionsAction,
  sendPasswordResetAction,
  setSecondaryRoleAction,
} from "@features/accounts/lib/accounts-admin-actions";
import { ACCOUNT_ACTIONS } from "@features/accounts/lib/management-action-set";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { listAllAccounts } from "@features/accounts/lib/server/account-admin-queries";
import { AccountsAdmin, type AccountsAdminActions } from "@features/admin/components/accounts-admin";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_ACCOUNTS_PATH } from "@features/admin/lib/admin-links";
import { AdminSectionShell, buildAdminSectionMetadata } from "@features/admin/pages/admin-section-shell";
import { listAdminStands } from "@features/stands/lib/server/stand-admin-queries";

const PAGE = ADMIN_COPY.pages.accounts;

const ACTIONS: AccountsAdminActions = {
  ...ACCOUNT_ACTIONS,
  resetPassword: sendPasswordResetAction,
  closeSessions: closeSessionsAction,
  clearTwoFactor: clearTwoFactorAction,
  setSecondaryRole: setSecondaryRoleAction,
};

export const adminAccountsPageMetadata = buildAdminSectionMetadata(PAGE, ADMIN_ACCOUNTS_PATH);

export function AdminAccountsPage({ searchParams }: Readonly<PageProps<"/admin/accounts">>) {
  return (
    <AdminSectionShell
      title={PAGE.title}

      renderContent={() => renderAccounts(searchParams)}
    />
  );
}

// The filter comes from the query string; the shell has already checked that the session is the sysadmin's, and the
// account is read again to know who is looking, so the list never offers the sysadmin to disable itself.
async function renderAccounts(searchParams: PageProps<"/admin/accounts">["searchParams"]) {
  const filter = parseAccountFilter(await searchParams);
  const [viewer, accounts, stands] = await Promise.all([requireSysadmin(), listAllAccounts(filter), listAdminStands()]);

  return (
    <AccountsAdmin
      accounts={accounts}
      filter={filter}
      stands={stands.map((stand) => ({ value: stand.id, label: stand.code }))}
      currentAccountId={viewer.id}
      actions={ACTIONS}
    />
  );
}

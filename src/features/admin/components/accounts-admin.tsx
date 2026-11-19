import type { ManagementAction, RoleOption } from "@features/accounts/components/invite-account-form";
import type { AccountAdminFilter } from "@features/accounts/lib/account-admin-filter";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { ACCOUNT_ROLES, type AdminAccountRow } from "@features/accounts/lib/types";
import { AccountFilterForm } from "@features/admin/components/account-filter-form";
import { InviteAccountForm } from "@features/accounts/components/invite-account-form";
import { AdminAccountList, type AdminAccountActions } from "@features/admin/components/admin-account-list";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";

export interface AccountsAdminActions extends AdminAccountActions {
  invite: ManagementAction;
}

interface AccountsAdminProps {
  accounts: readonly AdminAccountRow[];
  filter: AccountAdminFilter;
  /** The stands of the event as filter and invite options, by their code. */
  stands: readonly RoleOption[];
  currentAccountId: string;
  actions: AccountsAdminActions;
}

const COPY = ADMIN_COPY.accounts;

const INVITE_ROLES = ACCOUNT_ROLES.map((role) => ({ value: role, label: ACCOUNTS_COPY.management.panel.roles[role] }));

const DEFAULT_INVITE_ROLE = "help_desk";

const INVITE_HEADING_ID = "accounts-admin-invite";

const LIST_HEADING_ID = "accounts-admin-list";

/** Every staff account of every role: invite, filter, and what the sysadmin can do to each one (S8). */
export function AccountsAdmin({ accounts, filter, stands, currentAccountId, actions }: Readonly<AccountsAdminProps>) {
  const standCodes = Object.fromEntries(stands.map((stand) => [stand.value, stand.label]));

  return (
    <>
      <section aria-labelledby={INVITE_HEADING_ID} className="grid gap-4">
        <details className="border border-border p-4">
          <summary id={INVITE_HEADING_ID} className="min-h-11 cursor-pointer content-center type-mono">
            {COPY.inviteHeading}
          </summary>
          <div className="pt-4">
            <InviteAccountForm
              roles={INVITE_ROLES}
              defaultRole={DEFAULT_INVITE_ROLE}
              showDesk
              stands={stands}
              action={actions.invite}
            />
          </div>
        </details>
      </section>
      <section aria-labelledby={LIST_HEADING_ID} className="grid gap-6">
        <h2 id={LIST_HEADING_ID} className="type-section">
          {COPY.listHeading}
        </h2>
        <AccountFilterForm filter={filter} stands={stands} />
        <p role="status" className="type-tiny text-muted">
          {COPY.count(accounts.length)}
        </p>
        <AdminAccountList
          accounts={accounts}
          standCodes={standCodes}
          currentAccountId={currentAccountId}
          actions={actions}
        />
      </section>
    </>
  );
}

import { InviteAccountForm, type ManagementAction } from "@features/accounts/components/invite-account-form";
import { ManagedAccountList } from "@features/accounts/components/managed-account-list";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { getManagedRoles } from "@features/accounts/lib/invitation-rules";
import type { ManagedAccount } from "@features/accounts/lib/types";

export interface AccountsPanelActions {
  invite: ManagementAction;
  resend: ManagementAction;
  disable: ManagementAction;
}

interface AccountsPanelProps {
  heading: string;
  /** The role of the person who sees the panel: it decides which roles can be invited. */
  actorRole: string;
  accounts: readonly ManagedAccount[];
  actions: AccountsPanelActions;
}

const COPY = ACCOUNTS_COPY.management.panel;

/** The accounts a person manages: the invite form and the list with what can be done to each one (RF-40). */
export function AccountsPanel({ heading, actorRole, accounts, actions }: Readonly<AccountsPanelProps>) {
  const roles = getManagedRoles(actorRole).map((role) => ({ value: role, label: COPY.roles[role] }));
  const headingId = `accounts-panel-${actorRole}`;

  return (
    <section aria-labelledby={headingId} className="grid gap-6">
      <h2 id={headingId} className="type-section">
        {heading}
      </h2>
      <details className="border border-border p-4">
        <summary className="min-h-11 cursor-pointer content-center type-mono">{COPY.inviteHeading}</summary>
        <div className="pt-4">
          <InviteAccountForm
            roles={roles}
            showDesk={roles.some((role) => role.value === "kof_staff")}
            action={actions.invite}
          />
        </div>
      </details>
      <ManagedAccountList accounts={accounts} resendAction={actions.resend} disableAction={actions.disable} />
    </section>
  );
}

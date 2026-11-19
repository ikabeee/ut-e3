"use client";

import { ActionButton, DisableButton } from "@features/accounts/components/managed-account-list";
import type { ManagementAction } from "@features/accounts/components/invite-account-form";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import {
  ACCOUNT_ROLES,
  type AccountRole,
  type AccountStatus,
  type AdminAccountRow,
} from "@features/accounts/lib/types";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";

export interface AdminAccountActions {
  resend: ManagementAction;
  disable: ManagementAction;
  reactivate: ManagementAction;
  resetPassword: ManagementAction;
  closeSessions: ManagementAction;
  clearTwoFactor: ManagementAction;
}

interface AdminAccountListProps {
  accounts: readonly AdminAccountRow[];
  /** The code of each stand by its id, for the accounts of a stand. */
  standCodes: Readonly<Record<string, string>>;
  /** The sysadmin that is looking: it never gets the button to disable itself. */
  currentAccountId: string;
  actions: AdminAccountActions;
}

const COPY = ADMIN_COPY.accounts;

const PANEL_COPY = ACCOUNTS_COPY.management.panel;

export function AdminAccountList({ accounts, standCodes, currentAccountId, actions }: Readonly<AdminAccountListProps>) {
  if (accounts.length === 0) return <p className="type-mono text-muted">{COPY.empty}</p>;

  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {accounts.map((account) => (
        <li key={account.id} className="grid gap-3 border border-border p-4">
          <AccountSummary account={account} standCode={account.standId ? standCodes[account.standId] : undefined} />
          <AccountActions account={account} isSelf={account.id === currentAccountId} actions={actions} />
        </li>
      ))}
    </ul>
  );
}

function AccountSummary({ account, standCode }: Readonly<{ account: AdminAccountRow; standCode?: string }>) {
  return (
    <div className="grid gap-1">
      <p className="font-bold">{account.name}</p>
      <p className="type-tiny text-muted">{account.email}</p>
      <p className="type-tiny text-muted">{describe(account, standCode)}</p>
      <p className="type-tiny text-muted">
        {COPY.createdAt(formatMoment(account.createdAt))} · {describeLastLogin(account.lastLoginAt)}
      </p>
    </div>
  );
}

function AccountActions({
  account,
  isSelf,
  actions,
}: Readonly<{ account: AdminAccountRow; isSelf: boolean; actions: AdminAccountActions }>) {
  const { status, id } = account;

  return (
    <div className="flex flex-wrap items-start gap-3">
      <StatusAction accountId={id} status={status} actions={actions} />
      <ActionButton
        accountId={id}
        action={actions.closeSessions}
        label={COPY.closeSessions}
        hint={COPY.closeSessionsHint}
      />
      <ActionButton
        accountId={id}
        action={actions.clearTwoFactor}
        label={COPY.clearTwoFactor}
        hint={COPY.clearTwoFactorHint}
      />
      {status !== "disabled" && !isSelf && (
        <DisableButton accountId={id} name={account.name} action={actions.disable} />
      )}
    </div>
  );
}

// What each status can still do: an invited account gets its link again, an active one a new password, a disabled
// one its place back.
function StatusAction({
  accountId,
  status,
  actions,
}: Readonly<{ accountId: string; status: AccountStatus; actions: AdminAccountActions }>) {
  if (status === "invited") {
    return <ActionButton accountId={accountId} action={actions.resend} label={PANEL_COPY.resend} />;
  }

  if (status === "disabled") {
    return (
      <ActionButton
        accountId={accountId}
        action={actions.reactivate}
        label={PANEL_COPY.reactivate}
        hint={PANEL_COPY.reactivateHint}
      />
    );
  }

  return (
    <ActionButton
      accountId={accountId}
      action={actions.resetPassword}
      label={COPY.resetPassword}
      hint={COPY.resetPasswordHint}
    />
  );
}

function describe(account: AdminAccountRow, standCode?: string): string {
  const role = PANEL_COPY.roles[toRoleKey(account.role)];
  const stand = standCode ? ` · ${COPY.standOf(standCode)}` : "";
  const desk = account.kofDesk === null ? "" : ` · ${PANEL_COPY.deskOf(account.kofDesk)}`;

  return `${role}${stand}${desk} · ${PANEL_COPY.statuses[account.status]}`;
}

function describeLastLogin(lastLoginAt: Date | null): string {
  return lastLoginAt ? COPY.lastLogin(formatMoment(lastLoginAt)) : COPY.neverSignedIn;
}

function formatMoment(moment: Date | null): string {
  if (!moment) return COPY.unknownDate;

  const instant = moment.toISOString();

  return `${formatEventDate(instant, "numeric")} ${formatTimeOfDay(instant)}`;
}

// The database only holds the roles of the list; the label of the KOF staff is the safe fallback for anything else.
function toRoleKey(role: string): AccountRole {
  return ACCOUNT_ROLES.find((key) => key === role) ?? "kof_staff";
}

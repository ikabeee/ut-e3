"use client";

import { Button } from "@heroui/react";
import { useActionState } from "react";
import type { ManagementAction } from "@features/accounts/components/invite-account-form";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { ManagedAccount } from "@features/accounts/lib/types";
import { ConfirmActionForm } from "@shared/components/confirm-action-form";

interface ManagedAccountListProps {
  accounts: readonly ManagedAccount[];
  resendAction: ManagementAction;
  disableAction: ManagementAction;
  /** Optional so a list that cannot reactivate (an older caller) simply does not offer it. */
  reactivateAction?: ManagementAction;
}

type RowActions = Pick<ManagedAccountListProps, "resendAction" | "disableAction" | "reactivateAction">;

const COPY = ACCOUNTS_COPY.management.panel;

export function ManagedAccountList({
  accounts,
  resendAction,
  disableAction,
  reactivateAction,
}: Readonly<ManagedAccountListProps>) {
  if (accounts.length === 0) return <p className="type-mono text-muted">{COPY.empty}</p>;

  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {accounts.map((account) => (
        <AccountRow
          key={account.id}
          account={account}
          resendAction={resendAction}
          disableAction={disableAction}
          reactivateAction={reactivateAction}
        />
      ))}
    </ul>
  );
}

function AccountRow({
  account,
  resendAction,
  disableAction,
  reactivateAction,
}: Readonly<RowActions & { account: ManagedAccount }>) {
  return (
    <li className="grid gap-3 border border-border p-4">
      <div className="grid gap-1">
        <p className="font-bold">{account.name}</p>
        <p className="type-tiny text-muted">{account.email}</p>
        <p className="type-tiny text-muted">{describe(account)}</p>
      </div>
      {account.status === "invited" && (
        <ActionButton accountId={account.id} action={resendAction} label={COPY.resend} />
      )}
      {account.status !== "disabled" && (
        <DisableButton accountId={account.id} name={account.name} action={disableAction} />
      )}
      {account.status === "disabled" && reactivateAction ? (
        <ActionButton
          accountId={account.id}
          action={reactivateAction}
          label={COPY.reactivate}
          hint={COPY.reactivateHint}
        />
      ) : null}
    </li>
  );
}

function describe(account: ManagedAccount): string {
  const role = COPY.roles[toRoleKey(account.role)];
  const desk = account.kofDesk === null ? "" : ` · ${COPY.deskOf(account.kofDesk)}`;

  return `${role}${desk} · ${COPY.statuses[account.status]}`;
}

// A role outside the ones that the panels manage cannot be listed; the label of the KOF staff is the safe fallback.
function toRoleKey(role: string): keyof typeof COPY.roles {
  if (role === "kof_admin" || role === "raffle_admin" || role === "help_desk") return role;

  if (role === "stand_admin" || role === "stand_staff") return role;

  return "kof_staff";
}

interface RowButtonProps {
  accountId: string;
  action: ManagementAction;
  label: string;
  /** A line under the button that says what pressing it does. */
  hint?: string;
}

// A button that sends the id of one account and shows what the server answered under it.
function ActionButton({ accountId, action, label, hint }: Readonly<RowButtonProps>) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="accountId" value={accountId} />
      {state?.status === "error" && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      {state?.status === "done" && (
        <p role="status" className="text-sm text-success">
          {state.message}
        </p>
      )}
      <Button type="submit" variant="outline" className="min-h-11 justify-self-start" isPending={isPending}>
        {label}
      </Button>
      {hint ? <p className="m-0 type-tiny text-muted">{hint}</p> : null}
    </form>
  );
}

// Disabling closes the sessions of the person and cannot be undone from here, so the first press only asks.
function DisableButton({
  accountId,
  name,
  action,
}: Readonly<{ accountId: string; name: string; action: ManagementAction }>) {
  return (
    <ConfirmActionForm
      action={action}
      field={{ name: "accountId", value: accountId }}
      labels={{
        trigger: COPY.disable,
        prompt: COPY.confirmDisable(name),
        confirm: COPY.confirmDisableAction,
        cancel: COPY.cancel,
      }}
      triggerClassName="min-h-11 justify-self-start"
    />
  );
}

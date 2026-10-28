"use client";

import { Button } from "@heroui/react";
import { useActionState, useState } from "react";
import type { ManagementAction } from "@features/accounts/components/invite-account-form";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { ManagedAccount } from "@features/accounts/lib/types";

interface ManagedAccountListProps {
  accounts: readonly ManagedAccount[];
  resendAction: ManagementAction;
  disableAction: ManagementAction;
}

type RowActions = Pick<ManagedAccountListProps, "resendAction" | "disableAction">;

const COPY = ACCOUNTS_COPY.management.panel;

export function ManagedAccountList({ accounts, resendAction, disableAction }: Readonly<ManagedAccountListProps>) {
  if (accounts.length === 0) return <p className="type-mono text-muted">{COPY.empty}</p>;

  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {accounts.map((account) => (
        <AccountRow key={account.id} account={account} resendAction={resendAction} disableAction={disableAction} />
      ))}
    </ul>
  );
}

function AccountRow({ account, resendAction, disableAction }: Readonly<RowActions & { account: ManagedAccount }>) {
  return (
    <li className="grid gap-3 border border-border p-4">
      <div className="grid gap-1">
        <p className="font-bold">{account.name}</p>
        <p className="type-tiny text-muted">{account.email}</p>
        <p className="type-tiny text-muted">{describe(account)}</p>
      </div>
      {account.status === "invited" && <ResendButton accountId={account.id} action={resendAction} />}
      {account.status !== "disabled" && (
        <DisableButton accountId={account.id} name={account.name} action={disableAction} />
      )}
    </li>
  );
}

function describe(account: ManagedAccount): string {
  const role = COPY.roles[toRoleKey(account.role)];
  const desk = account.kofDesk === null ? "" : ` · ${COPY.deskOf(account.kofDesk)}`;

  return `${role}${desk} · ${COPY.statuses[account.status]}`;
}

// A role outside the four that the panels manage cannot be listed; the label of the staff is the safe fallback.
function toRoleKey(role: string): keyof typeof COPY.roles {
  if (role === "kof_admin" || role === "raffle_admin" || role === "help_desk") return role;

  return "kof_staff";
}

function ResendButton({ accountId, action }: Readonly<{ accountId: string; action: ManagementAction }>) {
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
        {COPY.resend}
      </Button>
    </form>
  );
}

// Disabling closes the sessions of the person and cannot be undone from here, so the first press only asks.
function DisableButton({
  accountId,
  name,
  action,
}: Readonly<{ accountId: string; name: string; action: ManagementAction }>) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);

  if (!isConfirming) {
    return (
      <Button variant="tertiary" className="min-h-11 justify-self-start" onPress={() => setIsConfirming(true)}>
        {COPY.disable}
      </Button>
    );
  }

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="accountId" value={accountId} />
      <p className="text-sm">{COPY.confirmDisable(name)}</p>
      {state?.status === "error" && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="danger" className="min-h-11" isPending={isPending}>
          {COPY.confirmDisableAction}
        </Button>
        <Button variant="tertiary" className="min-h-11" onPress={() => setIsConfirming(false)}>
          {COPY.cancel}
        </Button>
      </div>
    </form>
  );
}

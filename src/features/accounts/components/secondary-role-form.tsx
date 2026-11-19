"use client";

import { useActionState } from "react";
import { OptionSelect, type ManagementAction } from "@features/accounts/components/invite-account-form";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { NO_SECONDARY_ROLE } from "@features/accounts/lib/secondary-role";
import { SECONDARY_ROLES } from "@features/accounts/lib/types";
import { PendingButton } from "@shared/components/pending-button";
import { useErrorToast } from "@shared/hooks/use-error-toast";

interface SecondaryRoleFormProps {
  accountId: string;
  /** The role the account has now; null when it has none. */
  secondaryRole: string | null;
  action: ManagementAction;
}

const COPY = ACCOUNTS_COPY.management.panel;

const OPTIONS = [
  { value: NO_SECONDARY_ROLE, label: COPY.secondaryRole.none },
  ...SECONDARY_ROLES.map((role) => ({ value: role, label: COPY.roles[role] })),
];

/** The choice of the second role of a stand administrator (S1): a role from the list, or none to take it away. */
export function SecondaryRoleForm({ accountId, secondaryRole, action }: Readonly<SecondaryRoleFormProps>) {
  const [state, formAction, isPending] = useActionState(action, null);

  useErrorToast(state?.status === "error" ? state.message : null, state);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="accountId" value={accountId} />
      <OptionSelect
        name="secondaryRole"
        label={COPY.secondaryRole.label}
        options={OPTIONS}
        defaultValue={secondaryRole ?? NO_SECONDARY_ROLE}
      />
      <PendingButton type="submit" variant="outline" className="min-h-11" isPending={isPending}>
        {COPY.secondaryRole.submit}
      </PendingButton>
      {state?.status === "done" && (
        <p role="status" className="w-full text-sm text-success">
          {state.message}
        </p>
      )}
    </form>
  );
}

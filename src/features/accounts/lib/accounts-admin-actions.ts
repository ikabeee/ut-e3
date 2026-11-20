"use server";

import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import {
  clearPendingLoginChallenges,
  closeAccountSessions,
  sendAdminPasswordReset,
  setSecondaryRole,
  type SecondaryRoleResult,
} from "@features/accounts/lib/server/account-admin";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { failManagement, finishManagement } from "@features/accounts/lib/server/management-outcome";
import type { ManageFailure } from "@features/accounts/lib/server/invitations";
import type { SecondaryRole } from "@features/accounts/lib/types";
import { parseSecondaryRole } from "@features/accounts/lib/secondary-role";
import { readFormText } from "@shared/lib/form-data";

const ERRORS = ACCOUNTS_COPY.management.errors;

const OUTCOMES = ACCOUNTS_COPY.management.outcomes;

const PANEL_ROLES = ACCOUNTS_COPY.management.panel.roles;

// The tools of /admin/accounts that only the sysadmin has. Server Actions are public endpoints: the session is checked
// here, and the functions they call check the target again.
export async function sendPasswordResetAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const result = await sendAdminPasswordReset(actor, readFormText(form, "accountId"), new Date());

  if (result.status === "sent") return finishManagement(OUTCOMES.resetSent, result.emailId);

  return failManagement(describeManageFailure(result));
}

export async function closeSessionsAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const result = await closeAccountSessions(actor, readFormText(form, "accountId"));

  return result.status === "closed"
    ? finishManagement(OUTCOMES.sessionsClosed(result.count))
    : failManagement(describeManageFailure(result));
}

export async function clearTwoFactorAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const result = await clearPendingLoginChallenges(actor, readFormText(form, "accountId"));

  return result.status === "cleared"
    ? finishManagement(OUTCOMES.twoFactorCleared(result.count))
    : failManagement(describeManageFailure(result));
}

// Only the sysadmin gives or removes the secondary role of a stand administrator (S1, S2, L14). The field is the role,
// or `none` to remove it: an empty or missing field is not a choice, so it never removes a role by accident.
export async function setSecondaryRoleAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const choice = parseSecondaryRole(readFormText(form, "secondaryRole"));

  if (!choice.isValid) return failManagement(ERRORS.secondaryRoleInvalid);

  const result = await setSecondaryRole(actor, readFormText(form, "accountId"), choice.role);

  if (result.status !== "changed") return failManagement(describeSecondaryRoleFailure(result));

  return finishManagement(describeSecondaryRoleOutcome(choice.role));
}

function describeSecondaryRoleOutcome(secondaryRole: SecondaryRole | null): string {
  if (secondaryRole === null) return OUTCOMES.secondaryRoleRemoved;

  return OUTCOMES.secondaryRoleGranted(PANEL_ROLES[secondaryRole]);
}

function describeSecondaryRoleFailure(result: Exclude<SecondaryRoleResult, { status: "changed" }>): string {
  switch (result.status) {
    case "invalidRole":
      return ERRORS.secondaryRoleInvalid;
    case "notStandAdmin":
      return ERRORS.notStandAdmin;
    case "unchanged":
      return ERRORS.secondaryRoleUnchanged;
    case "lastSysadmin":
      return ERRORS.lastSysadmin;
    default:
      return describeManageFailure(result);
  }
}

function describeManageFailure(result: ManageFailure): string {
  switch (result.status) {
    case "forbidden":
      return ERRORS.forbidden;
    case "notFound":
      return ERRORS.notFound;
    case "wrongState":
      return ERRORS.wrongState;
  }
}

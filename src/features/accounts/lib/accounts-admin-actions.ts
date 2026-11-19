"use server";

import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import {
  clearPendingLoginChallenges,
  closeAccountSessions,
  sendAdminPasswordReset,
} from "@features/accounts/lib/server/account-admin";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { failManagement, finishManagement } from "@features/accounts/lib/server/management-outcome";
import type { ManageFailure } from "@features/accounts/lib/server/invitations";
import { readFormText } from "@shared/lib/form-data";

const ERRORS = ACCOUNTS_COPY.management.errors;

const OUTCOMES = ACCOUNTS_COPY.management.outcomes;

// The tools of /admin/accounts that only the sysadmin has. Server Actions are public endpoints: the session is checked
// here, and the functions they call check the target again.
export async function sendPasswordResetAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const result = await sendAdminPasswordReset(actor, readFormText(form, "accountId"), new Date());

  if (result.status === "sent") return finishManagement(OUTCOMES.resetSent, result.emailId);

  return failManagement(result.status === "rateLimited" ? ERRORS.rateLimited : describeManageFailure(result));
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

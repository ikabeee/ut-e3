"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { parseInviteInput } from "@features/accounts/lib/invitation-input";
import { requireAccountManager } from "@features/accounts/lib/server/current-account";
import {
  disableAccount,
  inviteAccount,
  resendInvitation,
  type InviteResult,
  type ManageFailure,
} from "@features/accounts/lib/server/invitations";
import { deliverQueuedEmail } from "@shared/lib/server/email-delivery";
import { readFormText } from "@shared/lib/form-data";

export type ManagementActionState = { status: "done"; message: string } | { status: "error"; message: string };

const ERRORS = ACCOUNTS_COPY.management.errors;

const OUTCOMES = ACCOUNTS_COPY.management.outcomes;

// Server Actions are public endpoints: the session and what the role may manage are checked here and again in the
// functions they call, which look at the role of the target account and not at the form.
export async function inviteAccountAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireAccountManager();
  const parsed = parseInviteInput(form);

  if (!parsed.isValid) return failure(parsed.message);

  const result = await inviteAccount(actor, parsed.input, new Date());

  if (result.status !== "invited") return failure(describeInviteFailure(result));

  return finish(OUTCOMES.invited, result.emailId);
}

export async function resendInvitationAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireAccountManager();
  const result = await resendInvitation(actor, readFormText(form, "accountId"), new Date());

  return result.status === "sent" ? finish(OUTCOMES.resent, result.emailId) : failure(describeManageFailure(result));
}

export async function disableAccountAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireAccountManager();
  const result = await disableAccount(actor, readFormText(form, "accountId"));

  return result.status === "disabled" ? finish(OUTCOMES.disabled) : failure(describeManageFailure(result));
}

function describeInviteFailure(result: Exclude<InviteResult, { status: "invited" }>): string {
  switch (result.status) {
    case "invalidDesk":
      return ERRORS.deskInvalid;
    case "emailTaken":
      return ERRORS.emailTaken;
    case "hasPassport":
      return ERRORS.hasPassport;
    case "deskTaken":
      return ERRORS.deskTaken;
    case "forbidden":
      return ERRORS.forbidden;
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

// The email leaves after the answer, and the screen shows the new list at once.
function finish(message: string, emailId?: string): ManagementActionState {
  if (emailId) after(() => deliverQueuedEmail(emailId));

  refresh();

  return { status: "done", message };
}

function failure(message: string): ManagementActionState {
  return { status: "error", message };
}

"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { parseRegistrationInput } from "@features/visitors/lib/registration-input";
import {
  resendPassportEmail,
  sendRecoveryLink,
  updateVisitorData,
} from "@features/visitors/lib/server/visitors-admin-mutations";
import { VISITORS_ADMIN_COPY } from "@features/visitors/lib/visitors-admin-copy";
import { readFormText } from "@shared/lib/form-data";
import { deliverQueuedEmail } from "@shared/lib/server/email-delivery";

export type VisitorAdminActionState = { status: "done"; message: string } | { status: "error"; message: string };

const { outcomes: OUTCOMES, errors: ERRORS } = VISITORS_ADMIN_COPY;

// Server Actions are public endpoints: each one starts by checking that the session is the sysadmin's.
export async function resendPassportAction(
  _previous: VisitorAdminActionState | null,
  form: FormData,
): Promise<VisitorAdminActionState> {
  const actor = await requireSysadmin();
  const result = await resendPassportEmail(actor.id, readFormText(form, "visitorId"));

  if (result.status !== "queued") return { status: "error", message: ERRORS[result.status] };

  return finishWithEmail(result.emailId, OUTCOMES.passportResent);
}

export async function sendRecoveryLinkAction(
  _previous: VisitorAdminActionState | null,
  form: FormData,
): Promise<VisitorAdminActionState> {
  const actor = await requireSysadmin();
  const result = await sendRecoveryLink(actor.id, readFormText(form, "visitorId"), new Date());

  if (result.status !== "queued") return { status: "error", message: ERRORS[result.status] };

  return finishWithEmail(result.emailId, OUTCOMES.recoverySent);
}

export async function updateVisitorAction(
  _previous: VisitorAdminActionState | null,
  form: FormData,
): Promise<VisitorAdminActionState> {
  const actor = await requireSysadmin();
  const parsed = parseRegistrationInput(form);

  if (!parsed.ok) return { status: "error", message: firstFieldError(parsed.fieldErrors) };

  const result = await updateVisitorData(actor.id, readFormText(form, "visitorId"), parsed.value);

  if (result.status !== "updated") return { status: "error", message: ERRORS[result.status] };

  refresh();

  return { status: "done", message: OUTCOMES.updated };
}

function finishWithEmail(emailId: string, message: string): VisitorAdminActionState {
  after(() => deliverQueuedEmail(emailId));
  refresh();

  return { status: "done", message };
}

function firstFieldError(errors: Partial<Record<"fullName" | "gamertag" | "email", string>>): string {
  return errors.fullName ?? errors.gamertag ?? errors.email ?? ERRORS.unchanged;
}

"use server";

import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { failManagement, finishManagement } from "@features/accounts/lib/server/management-outcome";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import {
  readEmailText,
  rebuildEmail,
  resendEmail,
  resendFailedEmails,
  runDeliveryPass,
} from "@features/admin/lib/server/email-mutations";
import type { EmailTextState } from "@features/admin/lib/types";
import { readFormText } from "@shared/lib/form-data";
import { createSmtpSender } from "@shared/lib/server/mailer";

const COPY = ADMIN_COPY.emails;

// Server Actions are public endpoints: each starts by checking that the session is the sysadmin's. No cache tag is
// needed: the outbox is read on every visit (the page streams behind `connection()`), and `finishManagement` refreshes it.
export async function resendOneEmailAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const emailId = readFormText(form, "emailId");

  if (!(await resendEmail(actor.id, emailId, new Date()))) return failManagement(COPY.resendRefused);

  return finishManagement(COPY.resent, emailId);
}

/** The count travels in the form: it is the number that was on screen when the sysadmin confirmed. */
export async function resendFailedEmailsAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const expectedCount = Number(readFormText(form, "expectedCount"));

  if (!Number.isInteger(expectedCount) || expectedCount < 1) return failManagement(COPY.invalid);

  const result = await resendFailedEmails(actor.id, expectedCount, new Date());

  if (result.status === "changed") return failManagement(COPY.resendFailed.changed(result.count));

  return finishManagement(COPY.resendFailed.done(result.count));
}

export async function rebuildEmailAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const result = await rebuildEmail(actor.id, readFormText(form, "emailId"), new Date());

  if (result.status !== "rebuilt") return failManagement(COPY.rebuildRefused[result.status]);

  return finishManagement(COPY.rebuilt, result.emailId);
}

export async function viewEmailTextAction(_previous: EmailTextState | null, form: FormData): Promise<EmailTextState> {
  const actor = await requireSysadmin();
  const text = await readEmailText(actor.id, readFormText(form, "emailId"));

  return text === null ? { status: "error", message: COPY.viewRefused } : { status: "text", text };
}

export async function sendNowAction(): Promise<ManagementActionState> {
  const actor = await requireSysadmin();

  // Without SMTP the delivery would fail every row and burn an attempt of each one.
  if (!process.env.SMTP_HOST) return failManagement(COPY.sendNow.noSmtp);

  const sent = await runDeliveryPass(actor.id, createSmtpSender(), new Date());

  return finishManagement(COPY.sendNow.done(sent));
}

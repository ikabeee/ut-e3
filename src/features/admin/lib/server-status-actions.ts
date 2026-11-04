"use server";

import { refresh } from "next/cache";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { failManagement, finishManagement } from "@features/accounts/lib/server/management-outcome";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { setPublicBracketEnabled } from "@features/tournament/lib/server/public-bracket-mutations";
import { readFormText } from "@shared/lib/form-data";
import { requeueEmail } from "@shared/lib/server/email-outbox-status";

const COPY = ADMIN_COPY.server;

// Server Actions are public endpoints: only the sysadmin resends from the outbox or opens and closes the bracket.
export async function resendEmailAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  await requireSysadmin();

  const emailId = readFormText(form, "emailId");

  if (!(await requeueEmail(emailId))) return failManagement(COPY.resendFailed);

  return finishManagement(COPY.resent, emailId);
}

/** "Cerrar al público" from the server status (RF-74); the KOF administrator has the same switch in /admin/kof. */
export async function setPublicBracketBySysadminAction(
  _previous: ManagementActionState | null,
  form: FormData,
): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const value = readFormText(form, "enabled");

  if (value !== "true" && value !== "false") return failManagement(COPY.invalid);

  await setPublicBracketEnabled(actor.id, value === "true");
  refresh();

  return { status: "done", message: value === "true" ? COPY.bracketOpened : COPY.bracketClosed };
}

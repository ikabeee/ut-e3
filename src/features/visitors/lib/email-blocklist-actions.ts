"use server";

import { refresh } from "next/cache";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { MAX_EMAILS_PER_SUBMISSION, parseBlockedEmails } from "@features/visitors/lib/email-blocklist-input";
import { addBlockedEmails, removeBlockedEmail } from "@features/visitors/lib/server/email-blocklist";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { readFormText } from "@shared/lib/form-data";

export type BlocklistActionState = { status: "done"; message: string } | { status: "error"; message: string };

const COPY = VISITORS_COPY.blocklist;

// Server Actions are public endpoints: only the sysadmin manages the list (RF-44).
export async function addBlockedEmailsAction(
  _previous: BlocklistActionState | null,
  form: FormData,
): Promise<BlocklistActionState> {
  const actor = await requireSysadmin();
  const parsed = parseBlockedEmails(form);

  if (!parsed.isValid) return { status: "error", message: describeRefusal(parsed.reason, parsed.invalid ?? "") };

  const added = await addBlockedEmails(actor.id, parsed.emails);

  refresh();

  return { status: "done", message: COPY.outcomes.added(added, parsed.emails.length - added) };
}

export async function removeBlockedEmailAction(
  _previous: BlocklistActionState | null,
  form: FormData,
): Promise<BlocklistActionState> {
  const actor = await requireSysadmin();

  if (!(await removeBlockedEmail(actor.id, readFormText(form, "email")))) {
    return { status: "error", message: COPY.errors.notFound };
  }

  refresh();

  return { status: "done", message: COPY.outcomes.removed };
}

function describeRefusal(reason: "empty" | "invalid" | "tooMany", invalid: string): string {
  if (reason === "invalid") return COPY.errors.invalid(invalid);

  return reason === "tooMany" ? COPY.errors.tooMany(MAX_EMAILS_PER_SUBMISSION) : COPY.errors.empty;
}

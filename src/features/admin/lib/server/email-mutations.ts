import "server-only";
import { isRebuildableKind } from "@features/admin/lib/email-rebuild-rules";
import { RESENDABLE_FAILED_WHERE } from "@features/admin/lib/server/email-queries";
import { REBUILDERS } from "@features/admin/lib/server/email-rebuild";
import type { Prisma } from "@generated/prisma/client";
import { isEmailKind } from "@shared/lib/email-kinds";
import { recordAudit } from "@shared/lib/server/audit-log";
import { deliverPendingEmails, MAX_ATTEMPTS, type SendEmail } from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";

const ENTITY_TYPE = "email_outbox";

// The audit entries never carry the address, the subject or the body of an email.
type Transaction = Prisma.TransactionClient;

export type ResendFailedResult = { status: "resent"; count: number } | { status: "changed"; count: number };

export type RebuildResult =
  { status: "rebuilt"; emailId: string } | { status: "notFound" | "notRebuildable" | "sourceGone" };

/** "Reenviar": an unsent email that still has its body goes back to the queue with no attempts. False if it cannot. */
export async function resendEmail(actorId: string, emailId: string, now: Date): Promise<boolean> {
  return getPrisma().$transaction(async (transaction) => {
    const { count } = await transaction.emailOutbox.updateMany({
      where: { id: emailId, sentAt: null, NOT: { text: "" } },
      data: { attempts: 0, nextAttemptAt: now },
    });

    if (count !== 1) return false;

    await audit(transaction, actorId, { action: "admin.email.resend", entityId: emailId, detail: {} });

    return true;
  });
}

/**
 * Every failed email with a body goes back to the queue. `expectedCount` is the number the sysadmin saw and confirmed:
 * when the list changed meanwhile nothing is written and the new number is answered.
 */
export async function resendFailedEmails(
  actorId: string,
  expectedCount: number,
  now: Date,
): Promise<ResendFailedResult> {
  return getPrisma().$transaction(async (transaction) => {
    const count = await transaction.emailOutbox.count({ where: RESENDABLE_FAILED_WHERE });

    if (count !== expectedCount) return { status: "changed", count };

    await transaction.emailOutbox.updateMany({
      where: RESENDABLE_FAILED_WHERE,
      data: { attempts: 0, nextAttemptAt: now },
    });
    await audit(transaction, actorId, { action: "admin.email.resend_failed", entityId: "failed", detail: { count } });

    return { status: "resent", count };
  });
}

/**
 * "Rehacer": an abandoned email whose body was erased is queued again from the record it was about, and the abandoned
 * row is replaced by the new one in the same transaction.
 */
export async function rebuildEmail(actorId: string, emailId: string, now: Date): Promise<RebuildResult> {
  return getPrisma().$transaction(async (transaction) => {
    const row = await transaction.emailOutbox.findFirst({
      where: { id: emailId, sentAt: null, attempts: { gte: MAX_ATTEMPTS }, text: "" },
      select: { kind: true, referenceId: true },
    });

    if (!row) return { status: "notFound" };

    if (!isEmailKind(row.kind) || !isRebuildableKind(row.kind) || !row.referenceId) return { status: "notRebuildable" };

    const newEmailId = await REBUILDERS[row.kind](transaction, row.referenceId, now);

    if (!newEmailId) return { status: "sourceGone" };

    await transaction.emailOutbox.delete({ where: { id: emailId } });
    await audit(transaction, actorId, {
      action: "admin.email.rebuild",
      entityId: emailId,
      detail: { kind: row.kind, newEmailId },
    });

    return { status: "rebuilt", emailId: newEmailId };
  });
}

/** The body of an email that still has one, and the audit entry of having read it (it can carry a PIN or a link). */
export async function readEmailText(actorId: string, emailId: string): Promise<string | null> {
  return getPrisma().$transaction(async (transaction) => {
    const row = await transaction.emailOutbox.findUnique({ where: { id: emailId }, select: { text: true } });

    if (!row?.text) return null;

    await audit(transaction, actorId, { action: "admin.email.view", entityId: emailId, detail: {} });

    return row.text;
  });
}

/** "Enviar ahora": the delivery pass of the one-minute timer, run right away. Answers how many emails left. */
export async function runDeliveryPass(actorId: string, send: SendEmail, now: Date): Promise<number> {
  const sent = await deliverPendingEmails(send, now);

  await getPrisma().$transaction((transaction) =>
    audit(transaction, actorId, { action: "admin.email.send_now", entityId: "outbox", detail: { sent } }),
  );

  return sent;
}

function audit(
  transaction: Transaction,
  actorId: string,
  entry: { action: string; entityId: string; detail: Prisma.InputJsonValue },
): Promise<void> {
  return recordAudit(transaction, { actorId, entityType: ENTITY_TYPE, ...entry });
}

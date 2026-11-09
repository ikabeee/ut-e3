import "server-only";
import { MAX_ATTEMPTS } from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";

export interface OutboxSummary {
  sent: number;
  pending: number;
  failed: number;
}

export interface UndeliveredEmail {
  id: string;
  /** The address with most of its local part hidden: the panel does not need the whole address. */
  to: string;
  subject: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  failed: boolean;
  /** False when the body was erased on abandonment: there is nothing left to send (the PIN or the link went with it). */
  canResend: boolean;
}

const UNSENT = { sentAt: null };

/** How many emails left, wait for an attempt, or were abandoned after `MAX_ATTEMPTS` (RF-73). */
export async function getOutboxSummary(): Promise<OutboxSummary> {
  const outbox = getPrisma().emailOutbox;

  const [sent, pending, failed] = await Promise.all([
    outbox.count({ where: { sentAt: { not: null } } }),
    outbox.count({ where: { ...UNSENT, attempts: { lt: MAX_ATTEMPTS } } }),
    outbox.count({ where: { ...UNSENT, attempts: { gte: MAX_ATTEMPTS } } }),
  ]);

  return { sent, pending, failed };
}

/** The unsent emails, the abandoned ones first and the oldest of each group first. */
export async function listUndeliveredEmails(limit: number): Promise<UndeliveredEmail[]> {
  const rows = await getPrisma().emailOutbox.findMany({
    where: UNSENT,
    orderBy: [{ attempts: "desc" }, { createdAt: "asc" }],
    take: limit,
    select: { id: true, to: true, subject: true, attempts: true, lastError: true, createdAt: true, text: true },
  });

  return rows.map(({ text, ...row }) => ({
    ...row,
    to: maskAddress(row.to),
    createdAt: row.createdAt.toISOString(),
    failed: row.attempts >= MAX_ATTEMPTS,
    canResend: text.length > 0,
  }));
}

/**
 * "Reenviar": an unsent email that still has its body goes back to the queue with its attempts at 0, to leave now.
 * Answers false when it was sent meanwhile, does not exist, or has no body.
 */
export async function requeueEmail(id: string, now: Date = new Date()): Promise<boolean> {
  const { count } = await getPrisma().emailOutbox.updateMany({
    where: { id, ...UNSENT, NOT: { text: "" } },
    data: { attempts: 0, nextAttemptAt: now },
  });

  return count === 1;
}

export function maskAddress(address: string): string {
  const at = address.lastIndexOf("@");

  if (at < 1) return "***";

  return `${address.slice(0, 1)}***${address.slice(at)}`;
}

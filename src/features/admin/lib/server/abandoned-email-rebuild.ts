import "server-only";
import { isRebuildableKind } from "@features/admin/lib/email-rebuild-rules";
import { REBUILDERS } from "@features/admin/lib/server/email-rebuild";
import type { Prisma, PrismaClient } from "@generated/prisma/client";
import { isEmailKind } from "@shared/lib/email-kinds";
import { recordAudit } from "@shared/lib/server/audit-log";
import { MAX_ATTEMPTS } from "@shared/lib/server/email-outbox";

/** Emails per kind; a row without a known kind counts under `UNTYPED`. */
export type KindCounts = Record<string, number>;

export interface AbandonedRebuildFailure {
  emailId: string;
  kind: string;
  message: string;
}

export interface AbandonedRebuildResult {
  /** Abandoned rows replaced by a fresh queued email. */
  rebuilt: KindCounts;
  /** Abandoned rows that cannot be made again (a login code, an emergency alert, no kind or no reference). */
  skipped: KindCounts;
  /** Rebuildable rows whose record is gone or changed; they stay abandoned. */
  sourceGone: KindCounts;
  /** Rows whose rebuild threw; each one rolled back alone and the others went on. */
  failed: AbandonedRebuildFailure[];
}

interface AbandonedRow {
  id: string;
  kind: string | null;
  referenceId: string | null;
}

type Outcome = "rebuilt" | "skipped" | "sourceGone";

type RowResult = { status: Outcome } | { status: "failed"; failure: AbandonedRebuildFailure };

export const UNTYPED = "untyped";

const ENTITY_TYPE = "email_outbox";

// The same state "Rehacer" accepts (and that the "Fallido" filter of /admin/emails lists without a body): all attempts
// used, never sent and the body erased.
const ABANDONED_WHERE: Prisma.EmailOutboxWhereInput = { sentAt: null, attempts: { gte: MAX_ATTEMPTS }, text: "" };

/**
 * Makes again every abandoned email of a kind that can be rebuilt, in one run, for when nobody can reach "Rehacer" in
 * /admin/emails. It uses the same rebuilders as that button: a link or PIN kind issues a new one, the abandoned row is
 * replaced by a queued email and the change is audited with the same action, with no actor (the system), all in one
 * transaction per row. Nothing is sent here: the rows wait for the throttled mail worker. A second run finds nothing
 * left to rebuild, because a rebuilt row is no longer abandoned.
 */
export async function rebuildAbandonedEmails(prisma: PrismaClient, now: Date): Promise<AbandonedRebuildResult> {
  const rows = await prisma.emailOutbox.findMany({
    where: ABANDONED_WHERE,
    select: { id: true, kind: true, referenceId: true },
    orderBy: { createdAt: "asc" },
  });

  const result: AbandonedRebuildResult = { rebuilt: {}, skipped: {}, sourceGone: {}, failed: [] };

  for (const row of rows) {
    const outcome = await rebuildRow(prisma, row, now);

    if (outcome.status === "failed") {
      result.failed.push(outcome.failure);
    } else {
      increment(result[outcome.status], row.kind ?? UNTYPED);
    }
  }

  return result;
}

// A row that throws is rolled back alone and answered as a failure, so the next rows still run.
async function rebuildRow(prisma: PrismaClient, row: AbandonedRow, now: Date): Promise<RowResult> {
  try {
    const status = await prisma.$transaction((transaction) => rebuildInTransaction(transaction, row, now));

    return { status };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return { status: "failed", failure: { emailId: row.id, kind: row.kind ?? UNTYPED, message } };
  }
}

async function rebuildInTransaction(
  transaction: Prisma.TransactionClient,
  row: AbandonedRow,
  now: Date,
): Promise<Outcome> {
  const { kind, referenceId } = row;

  if (!isEmailKind(kind) || !isRebuildableKind(kind) || !referenceId) return "skipped";

  // Read again inside the transaction: a row sent or erased meanwhile is not abandoned any more.
  const stillAbandoned = await transaction.emailOutbox.count({ where: { id: row.id, ...ABANDONED_WHERE } });

  if (stillAbandoned === 0) return "skipped";

  const newEmailId = await REBUILDERS[kind](transaction, referenceId, now);

  if (!newEmailId) return "sourceGone";

  await transaction.emailOutbox.delete({ where: { id: row.id } });
  await recordAudit(transaction, {
    actorId: null,
    action: "admin.email.rebuild",
    entityType: ENTITY_TYPE,
    entityId: row.id,
    detail: { kind, newEmailId, source: "script" },
  });

  return "rebuilt";
}

function increment(counts: KindCounts, label: string): void {
  counts[label] = (counts[label] ?? 0) + 1;
}

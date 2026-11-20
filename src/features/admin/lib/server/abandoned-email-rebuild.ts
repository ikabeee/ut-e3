import "server-only";
import type { RebuildableKind } from "@features/admin/lib/email-rebuild-rules";
import { REBUILDERS } from "@features/admin/lib/server/email-rebuild";
import type { Prisma, PrismaClient } from "@generated/prisma/client";
import type { EmailKind } from "@shared/lib/email-kinds";
import { recordAudit } from "@shared/lib/server/audit-log";
import { MAX_ATTEMPTS } from "@shared/lib/server/email-outbox";

/**
 * The only kinds this script reads, counts or rebuilds: the staff's. Visitor data (passport, recovery link, KOF entry,
 * raffle winner) is never touched here, and neither are login codes or emergency alerts.
 */
export const STAFF_EMAIL_KINDS = ["staff_invitation", "password_reset"] as const satisfies readonly (
  EmailKind | RebuildableKind
)[];

export type StaffEmailKind = (typeof STAFF_EMAIL_KINDS)[number];

/** Emails per staff kind. */
export type KindCounts = Record<string, number>;

export interface AbandonedRebuildFailure {
  emailId: string;
  kind: string;
  message: string;
}

export interface AbandonedRebuildResult {
  /** Abandoned rows replaced by a fresh queued email. */
  rebuilt: KindCounts;
  /** Abandoned staff rows that cannot be made again: they have no reference, or were sent or erased meanwhile. */
  skipped: KindCounts;
  /** Staff rows whose account is gone or changed; they stay abandoned. */
  sourceGone: KindCounts;
  /** Rows whose rebuild threw; each one rolled back alone and the others went on. */
  failed: AbandonedRebuildFailure[];
  /** Dry run only: what a real run would try to rebuild (no recipient, no token); empty in a real run. */
  planned: PlannedRebuild[];
}

export interface PlannedRebuild {
  emailId: string;
  kind: StaffEmailKind;
  /** When the email was queued the first time. */
  createdAt: Date;
}

export interface AbandonedRebuildOptions {
  /** Lists what would be rebuilt and writes nothing: no rows, no tokens, no audit. */
  dryRun?: boolean;
}

interface AbandonedRow {
  id: string;
  kind: StaffEmailKind;
  referenceId: string | null;
  createdAt: Date;
}

type Outcome = "rebuilt" | "skipped" | "sourceGone";

type RowResult = { status: Outcome } | { status: "failed"; failure: AbandonedRebuildFailure };

const ENTITY_TYPE = "email_outbox";

// The same state "Rehacer" accepts (and that the "Fallido" filter of /admin/emails lists without a body): all attempts
// used, never sent and the body erased. Always together with the staff kinds: no other row is ever selected.
const ABANDONED_STAFF_WHERE: Prisma.EmailOutboxWhereInput = {
  kind: { in: [...STAFF_EMAIL_KINDS] },
  sentAt: null,
  attempts: { gte: MAX_ATTEMPTS },
  text: "",
};

/**
 * Makes again every abandoned staff email (invitation and password reset), in one run, for when nobody can reach
 * "Rehacer" in /admin/emails. It only selects those two kinds; visitor emails are never read, deleted or queued again.
 * It uses the same rebuilders as that button: a link or PIN kind issues a new one, the abandoned row is
 * replaced by a queued email and the change is audited with the same action, with no actor (the system), all in one
 * transaction per row. Nothing is sent here: the rows wait for the throttled mail worker. A second run finds nothing
 * left to rebuild, because a rebuilt row is no longer abandoned. With `dryRun` it only lists the candidates.
 */
export async function rebuildAbandonedEmails(
  prisma: PrismaClient,
  now: Date,
  options: AbandonedRebuildOptions = {},
): Promise<AbandonedRebuildResult> {
  const rows = await findAbandonedStaffRows(prisma);
  const result: AbandonedRebuildResult = { rebuilt: {}, skipped: {}, sourceGone: {}, failed: [], planned: [] };

  if (options.dryRun) return planRebuild(rows, result);

  for (const row of rows) {
    const outcome = await rebuildRow(prisma, row, now);

    if (outcome.status === "failed") {
      result.failed.push(outcome.failure);
    } else {
      increment(result[outcome.status], row.kind);
    }
  }

  return result;
}

async function findAbandonedStaffRows(prisma: PrismaClient): Promise<AbandonedRow[]> {
  const rows = await prisma.emailOutbox.findMany({
    where: ABANDONED_STAFF_WHERE,
    select: { id: true, kind: true, referenceId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // The query already limits the kinds; the guard only narrows the type.
  return rows.flatMap(({ kind, ...row }) => (isStaffEmailKind(kind) ? [{ ...row, kind }] : []));
}

function isStaffEmailKind(kind: string | null): kind is StaffEmailKind {
  return STAFF_EMAIL_KINDS.some((staffKind) => staffKind === kind);
}

// Reads nothing more and writes nothing: a row with a reference is a candidate (its account may still be gone).
function planRebuild(rows: AbandonedRow[], result: AbandonedRebuildResult): AbandonedRebuildResult {
  for (const row of rows) {
    if (row.referenceId) {
      result.planned.push({ emailId: row.id, kind: row.kind, createdAt: row.createdAt });
    } else {
      increment(result.skipped, row.kind);
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

    return { status: "failed", failure: { emailId: row.id, kind: row.kind, message } };
  }
}

async function rebuildInTransaction(
  transaction: Prisma.TransactionClient,
  row: AbandonedRow,
  now: Date,
): Promise<Outcome> {
  const { kind, referenceId } = row;

  if (!referenceId) return "skipped";

  // Read again inside the transaction: a row sent or erased meanwhile is not abandoned any more.
  const stillAbandoned = await transaction.emailOutbox.count({ where: { id: row.id, ...ABANDONED_STAFF_WHERE } });

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

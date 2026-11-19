import "server-only";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import type { Prisma, PrismaClient } from "@generated/prisma/client";
import type { EmailKind } from "@shared/lib/email-kinds";
import { recordAudit } from "@shared/lib/server/audit-log";

export interface LegacyEmailKindsResult {
  /** Rows that got their kind and reference. */
  updated: number;
  /** Unsent rows without a kind that could not be identified; they stay as they were. */
  untouched: number;
}

interface LegacyRow {
  id: string;
  to: string;
  subject: string;
}

interface Inference {
  kind: EmailKind;
  referenceId: string;
}

const ENTITY_TYPE = "email_outbox";

const PASSPORT_SUBJECT_PREFIX = VISITORS_COPY.email.subject("");

/**
 * Gives a kind and a reference to the unsent emails that were queued before the outbox saved them (`kind` is null), so
 * the sysadmin can rebuild them. The kind comes from the subject (the passport email or the recovery email) and the
 * visitor from the recipient, and from the gamertag of the subject when it has one. Only rows with a null kind are
 * written; a row that cannot be identified stays untouched. Every update goes with its audit entry in one transaction,
 * and a second run finds nothing left to do.
 */
export async function backfillLegacyEmailKinds(prisma: PrismaClient): Promise<LegacyEmailKindsResult> {
  const rows = await prisma.emailOutbox.findMany({
    where: { kind: null, sentAt: null },
    select: { id: true, to: true, subject: true },
    orderBy: { createdAt: "asc" },
  });

  const result: LegacyEmailKindsResult = { updated: 0, untouched: 0 };

  for (const row of rows) {
    const inference = await inferOrigin(prisma, row);
    const wasUpdated = inference ? await saveOrigin(prisma, row.id, inference) : false;

    if (wasUpdated) {
      result.updated++;
    } else {
      result.untouched++;
    }
  }

  return result;
}

async function inferOrigin(prisma: PrismaClient, row: LegacyRow): Promise<Inference | null> {
  if (row.subject === VISITORS_COPY.recovery.email.subject) {
    const visitorId = await findVisitorId(prisma, row.to);

    return visitorId ? { kind: "recovery_link", referenceId: visitorId } : null;
  }

  const gamertag = readPassportGamertag(row.subject);

  if (!gamertag) return null;

  const visitorId = await findVisitorId(prisma, row.to, gamertag);

  return visitorId ? { kind: "visitor_passport", referenceId: visitorId } : null;
}

function readPassportGamertag(subject: string): string | null {
  if (!subject.startsWith(PASSPORT_SUBJECT_PREFIX)) return null;

  return subject.slice(PASSPORT_SUBJECT_PREFIX.length) || null;
}

// The recipient may have been written with other letter case than the registration.
async function findVisitorId(prisma: PrismaClient, address: string, gamertag?: string): Promise<string | null> {
  const where: Prisma.VisitorWhereInput = { email: { in: [address, address.toLowerCase()] } };

  if (gamertag) where.gamertag = gamertag;

  const visitor = await prisma.visitor.findFirst({ where, select: { id: true } });

  return visitor?.id ?? null;
}

// The `kind: null` guard keeps a row that got its kind meanwhile (a concurrent run) from being written twice.
async function saveOrigin(prisma: PrismaClient, emailId: string, inference: Inference): Promise<boolean> {
  return prisma.$transaction(async (transaction) => {
    const { count } = await transaction.emailOutbox.updateMany({
      where: { id: emailId, kind: null },
      data: { kind: inference.kind, referenceId: inference.referenceId },
    });

    if (count === 0) return false;

    await recordAudit(transaction, {
      actorId: null,
      action: "admin.email.backfill_kind",
      entityType: ENTITY_TYPE,
      entityId: emailId,
      detail: { kind: inference.kind, referenceId: inference.referenceId },
    });

    return true;
  });
}

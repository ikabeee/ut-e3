import "server-only";
import { EMAIL_PAGE_SIZE, type EmailFilters } from "@features/admin/lib/email-filters";
import { isRebuildableKind } from "@features/admin/lib/email-rebuild-rules";
import type { EmailPage, EmailRow, EmailStatus } from "@features/admin/lib/types";
import type { Prisma } from "@generated/prisma/client";
import { isEmailKind } from "@shared/lib/email-kinds";
import { MAX_ATTEMPTS } from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";

// Cancun has no daylight saving time: a day starts at 00:00 at UTC-5 all year.
const CANCUN_OFFSET = "-05:00";

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_WHERE: Record<EmailStatus, Prisma.EmailOutboxWhereInput> = {
  sent: { sentAt: { not: null } },
  pending: { sentAt: null, attempts: { lt: MAX_ATTEMPTS } },
  failed: { sentAt: null, attempts: { gte: MAX_ATTEMPTS } },
};

/** The unsent emails that still have their body, in the state the single and the mass resend accept. */
export const RESENDABLE_FAILED_WHERE: Prisma.EmailOutboxWhereInput = {
  sentAt: null,
  attempts: { gte: MAX_ATTEMPTS },
  NOT: { text: "" },
};

/** One page of the whole outbox, newest first, with the full address: only the sysadmin reads this. */
export async function listEmails(filters: EmailFilters): Promise<EmailPage> {
  const where = buildWhere(filters);
  const total = await getPrisma().emailOutbox.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / EMAIL_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  const rows = await getPrisma().emailOutbox.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * EMAIL_PAGE_SIZE,
    take: EMAIL_PAGE_SIZE,
  });

  return { rows: rows.map(toEmailRow), total, page, pageCount };
}

/** How many failed emails the mass resend would put back in the queue. */
export async function countResendableFailed(): Promise<number> {
  return getPrisma().emailOutbox.count({ where: RESENDABLE_FAILED_WHERE });
}

function buildWhere(filters: EmailFilters): Prisma.EmailOutboxWhereInput {
  const conditions: Prisma.EmailOutboxWhereInput[] = [];

  if (filters.status !== "all") conditions.push(STATUS_WHERE[filters.status]);

  if (filters.recipient) conditions.push({ to: { contains: filters.recipient } });

  if (filters.subject) conditions.push({ subject: { contains: filters.subject } });

  if (filters.from) conditions.push({ createdAt: { gte: startOfDay(filters.from) } });

  // The last day is included whole.
  if (filters.to) conditions.push({ createdAt: { lt: new Date(startOfDay(filters.to).getTime() + DAY_MS) } });

  return { AND: conditions };
}

function startOfDay(day: string): Date {
  return new Date(`${day}T00:00:00${CANCUN_OFFSET}`);
}

function toEmailRow(row: Prisma.EmailOutboxGetPayload<object>): EmailRow {
  const kind = isEmailKind(row.kind) ? row.kind : null;
  const status = readStatus(row);
  const hasBody = row.text.length > 0;

  return {
    id: row.id,
    to: row.to,
    subject: row.subject,
    kind,
    status,
    attempts: row.attempts,
    nextAttemptAt: row.nextAttemptAt.toISOString(),
    sentAt: row.sentAt?.toISOString() ?? null,
    lastError: row.lastError,
    createdAt: row.createdAt.toISOString(),
    hasBody,
    canResend: status !== "sent" && hasBody,
    canRebuild: status === "failed" && !hasBody && isRebuildableKind(kind) && row.referenceId !== null,
  };
}

function readStatus(row: { sentAt: Date | null; attempts: number }): EmailStatus {
  if (row.sentAt) return "sent";

  return row.attempts >= MAX_ATTEMPTS ? "failed" : "pending";
}

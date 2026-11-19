import "server-only";
import { stat } from "node:fs/promises";
import type { RecoveryStatus } from "@features/admin/lib/types";
import { OVERLOAD_WATCH_JOB } from "@features/admin/lib/server/overload-watch";
import { getPublicBracketEnabled } from "@features/tournament/lib/server/public-bracket-queries";
import { getJobStatus } from "@shared/lib/server/background-jobs";
import { getDatabaseFreeBytes } from "@shared/lib/server/disk-space";
import { getOutboxSummary } from "@shared/lib/server/email-outbox-status";
import { EMAIL_WORKER_JOB } from "@shared/lib/server/email-worker";
import { getPrisma } from "@shared/lib/server/prisma";
import { getDatabasePath } from "@shared/lib/server/sqlite-file";

/** The state of every background service and of the database files, read on every visit of /admin/recovery. */
export async function getRecoveryStatus(): Promise<RecoveryStatus> {
  const [outbox, lastSentAt, lastFailure, database, publicBracketEnabled] = await Promise.all([
    getOutboxSummary(),
    getLastSentAt(),
    getLastFailure(),
    getDatabaseFiles(),
    getPublicBracketEnabled(),
  ]);

  return {
    mail: {
      smtpHost: process.env.SMTP_HOST?.trim() || null,
      worker: getJobStatus(EMAIL_WORKER_JOB),
      outbox,
      lastSentAt,
      lastFailure,
    },
    overloadWatch: getJobStatus(OVERLOAD_WATCH_JOB),
    database,
    publicBracketEnabled,
  };
}

async function getLastSentAt(): Promise<string | null> {
  const row = await getPrisma().emailOutbox.findFirst({
    where: { sentAt: { not: null } },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });

  return row?.sentAt?.toISOString() ?? null;
}

// The outbox keeps the error of the last attempt of each email that did not leave; the newest one is the freshest news.
async function getLastFailure(): Promise<string | null> {
  const row = await getPrisma().emailOutbox.findFirst({
    where: { sentAt: null, lastError: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { lastError: true },
  });

  return row?.lastError ?? null;
}

async function getDatabaseFiles(): Promise<RecoveryStatus["database"]> {
  const databasePath = getDatabasePath();

  const [databaseBytes, walBytes, shmBytes, freeBytes] = await Promise.all([
    getFileSize(databasePath),
    getFileSize(`${databasePath}-wal`),
    getFileSize(`${databasePath}-shm`),
    getDatabaseFreeBytes(),
  ]);

  return { databaseBytes, walBytes, shmBytes, freeBytes };
}

// SQLite deletes the WAL and SHM files when the last connection closes, so a missing file is an empty one.
async function getFileSize(file: string): Promise<number> {
  try {
    return (await stat(file)).size;
  } catch {
    return 0;
  }
}

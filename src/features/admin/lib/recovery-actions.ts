"use server";

import { updateTag } from "next/cache";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { failManagement, finishManagement } from "@features/accounts/lib/server/management-outcome";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { PUBLIC_CACHE_TAGS } from "@features/admin/lib/server/public-cache-tags";
import { runCheckpoint, runQuickCheck } from "@features/admin/lib/server/database-maintenance";
import { sendSmtpTest } from "@features/admin/lib/server/mail-recovery";
import { OVERLOAD_WATCH_JOB } from "@features/admin/lib/server/overload-watch";
import { auditRecovery } from "@features/admin/lib/server/recovery-audit";
import { restartJob, trackRun } from "@shared/lib/server/background-jobs";
import { getOutboxSummary } from "@shared/lib/server/email-outbox-status";
import { deliverEmailsNow, EMAIL_WORKER_JOB } from "@shared/lib/server/email-worker";

const COPY = ADMIN_COPY.recovery;

// They take no input (the form has no fields). Server Actions are public endpoints: each one starts with requireSysadmin() and leaves an entry in the audit log.
// Errors come back as a state with the exact message, which the screen shows as a toast.
export async function testSmtpAction(): Promise<ManagementActionState> {
  const actor = await requireSysadmin();
  const error = await sendSmtpTest(actor.email);

  await auditRecovery({
    actorId: actor.id,
    action: "smtp_test",
    target: "smtp",
    detail: error ? { ok: false, error } : { ok: true },
  });

  return error ? failManagement(COPY.smtpFailed(error)) : finishManagement(COPY.smtpSent(actor.email));
}

/** "Reintentar envíos ahora": the delivery of the 60 s worker, run at once; the emails still in their backoff wait. */
export async function retryEmailsAction(): Promise<ManagementActionState> {
  const actor = await requireSysadmin();

  try {
    const sent = await trackRun(EMAIL_WORKER_JOB, deliverEmailsNow);
    const { pending } = await getOutboxSummary();

    await auditRecovery({
      actorId: actor.id,
      action: "retry_emails",
      target: EMAIL_WORKER_JOB,
      detail: { sent, pending },
    });

    return finishManagement(COPY.retried(sent, pending));
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : String(cause);

    await auditRecovery({ actorId: actor.id, action: "retry_emails", target: EMAIL_WORKER_JOB, detail: { error } });

    return failManagement(COPY.retryFailed(error));
  }
}

export async function restartEmailWorkerAction(): Promise<ManagementActionState> {
  const actor = await requireSysadmin();

  return restart(actor.id, EMAIL_WORKER_JOB, { done: COPY.workerRestarted, missing: COPY.workerNotStarted });
}

export async function restartOverloadWatchAction(): Promise<ManagementActionState> {
  const actor = await requireSysadmin();

  return restart(actor.id, OVERLOAD_WATCH_JOB, { done: COPY.watchRestarted, missing: COPY.watchNotStarted });
}

export async function runQuickCheckAction(): Promise<ManagementActionState> {
  const actor = await requireSysadmin();

  try {
    const result = await runQuickCheck();

    await auditRecovery({ actorId: actor.id, action: "quick_check", target: "database", detail: { ...result } });

    return result.ok
      ? finishManagement(COPY.quickCheckOk)
      : failManagement(COPY.quickCheckFailed(result.messages.join("; ")));
  } catch (cause) {
    return failManagement(COPY.quickCheckError(describe(cause)));
  }
}

export async function runCheckpointAction(): Promise<ManagementActionState> {
  const actor = await requireSysadmin();

  try {
    const result = await runCheckpoint();

    await auditRecovery({ actorId: actor.id, action: "checkpoint", target: "database", detail: { ...result } });

    return result.isBusy ? failManagement(COPY.checkpointBusy) : finishManagement(COPY.checkpointDone);
  } catch (cause) {
    return failManagement(COPY.checkpointError(describe(cause)));
  }
}

export async function invalidateCachesAction(): Promise<ManagementActionState> {
  const actor = await requireSysadmin();

  PUBLIC_CACHE_TAGS.forEach((tag) => updateTag(tag));
  await auditRecovery({
    actorId: actor.id,
    action: "invalidate_caches",
    target: "caches",
    detail: { tags: [...PUBLIC_CACHE_TAGS] },
  });

  return finishManagement(COPY.cachesInvalidated(PUBLIC_CACHE_TAGS.length));
}

async function restart(
  actorId: string,
  job: string,
  messages: { done: string; missing: string },
): Promise<ManagementActionState> {
  const isRestarted = restartJob(job);

  await auditRecovery({ actorId, action: "restart", target: job, detail: { isRestarted } });

  return isRestarted ? finishManagement(messages.done) : failManagement(messages.missing);
}

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

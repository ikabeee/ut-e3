import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { RecoveryDatabaseSection } from "@features/admin/components/recovery-database-section";
import { RecoveryActionForm, type RecoveryAction } from "@features/admin/components/recovery-action-form";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { JobState, RecoveryStatus } from "@features/admin/lib/types";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";

export interface RecoveryActions {
  testSmtp: RecoveryAction;
  retryEmails: RecoveryAction;
  restartEmailWorker: RecoveryAction;
  restartOverloadWatch: RecoveryAction;
  runQuickCheck: RecoveryAction;
  runCheckpoint: RecoveryAction;
  invalidateCaches: RecoveryAction;
}

interface RecoveryPanelProps {
  status: RecoveryStatus;
  actions: RecoveryActions;
  /** Where "Actualizar" goes: the same page, read again. */
  refreshHref: string;
}

const COPY = ADMIN_COPY.recovery;

/** The state of each background service with its recovery actions (S3); the bracket switch goes below it in the page. */
export function RecoveryPanel({ status, actions, refreshHref }: Readonly<RecoveryPanelProps>) {
  return (
    <div className="grid gap-10">
      <Link href={refreshHref} className={buttonVariants({ variant: "outline", className: "min-h-11 w-fit" })}>
        {COPY.refresh}
      </Link>
      <MailSection mail={status.mail} actions={actions} />
      <OverloadSection job={status.overloadWatch} restart={actions.restartOverloadWatch} />
      <LogRetentionSection job={status.logRetention} />
      <RecoveryDatabaseSection
        database={status.database}
        runQuickCheck={actions.runQuickCheck}
        runCheckpoint={actions.runCheckpoint}
      />
      <CachesSection invalidate={actions.invalidateCaches} />
    </div>
  );
}

function MailSection({ mail, actions }: Readonly<{ mail: RecoveryStatus["mail"]; actions: RecoveryActions }>) {
  const copy = COPY.mail;

  return (
    <section aria-labelledby="recovery-mail-heading" className="grid gap-3" data-testid="recovery-mail">
      <h2 id="recovery-mail-heading" className="type-section">
        {copy.heading}
      </h2>
      <p>{mail.smtpHost ? copy.smtpConfigured(mail.smtpHost) : copy.smtpMissing}</p>
      <JobLines title={copy.worker} job={mail.worker} />
      <p>{copy.outbox(mail.outbox.sent, mail.outbox.pending, mail.outbox.failed)}</p>
      <p>{mail.lastSentAt ? copy.lastSent(formatMoment(mail.lastSentAt)) : copy.noneSent}</p>
      <p className="text-sm wrap-break-word text-muted">
        {mail.lastFailure ? copy.lastFailure(mail.lastFailure) : copy.noFailure}
      </p>
      <div className="flex flex-wrap items-start gap-3">
        <RecoveryActionForm action={actions.testSmtp} label={copy.testSmtp} pendingLabel={copy.testingSmtp} />
        <RecoveryActionForm action={actions.retryEmails} label={copy.retry} pendingLabel={copy.retrying} />
        <RecoveryActionForm action={actions.restartEmailWorker} label={copy.restart} pendingLabel={copy.restarting} />
      </div>
    </section>
  );
}

function OverloadSection({ job, restart }: Readonly<{ job: JobState | null; restart: RecoveryAction }>) {
  const copy = COPY.overload;

  return (
    <section aria-labelledby="recovery-overload-heading" className="grid gap-3" data-testid="recovery-overload">
      <h2 id="recovery-overload-heading" className="type-section">
        {copy.heading}
      </h2>
      <JobLines title={copy.job} job={job} />
      <RecoveryActionForm action={restart} label={copy.restart} pendingLabel={copy.restarting} />
    </section>
  );
}

function LogRetentionSection({ job }: Readonly<{ job: JobState | null }>) {
  const copy = COPY.logRetention;

  return (
    <section
      aria-labelledby="recovery-log-retention-heading"
      className="grid gap-3"
      data-testid="recovery-log-retention"
    >
      <h2 id="recovery-log-retention-heading" className="type-section">
        {copy.heading}
      </h2>
      <JobLines title={copy.job} job={job} />
    </section>
  );
}

function CachesSection({ invalidate }: Readonly<{ invalidate: RecoveryAction }>) {
  const copy = COPY.caches;

  return (
    <section aria-labelledby="recovery-caches-heading" className="grid gap-3" data-testid="recovery-caches">
      <h2 id="recovery-caches-heading" className="type-section">
        {copy.heading}
      </h2>
      <p className="text-sm text-muted">{copy.lead}</p>
      <RecoveryActionForm action={invalidate} label={copy.invalidate} pendingLabel={copy.invalidating} />
    </section>
  );
}

function JobLines({ title, job }: Readonly<{ title: string; job: JobState | null }>) {
  return (
    <div className="grid gap-1">
      <p>
        <strong>{title}:</strong> {describeJob(job)}
      </p>
      {job?.lastError ? (
        <p role="alert" className="text-sm wrap-break-word text-danger">
          {COPY.lastError(job.lastError)}
        </p>
      ) : null}
    </div>
  );
}

function describeJob(job: JobState | null): string {
  if (!job) return COPY.notStarted;

  const state = job.isRunning ? COPY.running : COPY.stopped;

  return `${state}. ${job.lastRunAt ? COPY.lastRun(formatMoment(job.lastRunAt)) : COPY.never}`;
}

function formatMoment(instant: string): string {
  return `${formatEventDate(instant, "numeric")} ${formatTimeOfDay(instant)}`;
}

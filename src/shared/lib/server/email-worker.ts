import "server-only";
import { startJob } from "@shared/lib/server/background-jobs";
import { deliverPendingEmails } from "@shared/lib/server/email-outbox";
import { createSmtpSender } from "@shared/lib/server/mailer";
import { logServerEvent } from "@shared/lib/server/server-log";

export const EMAIL_WORKER_JOB = "email-outbox";

const DELIVER_INTERVAL_MS = 60_000;

/**
 * Retries the email outbox every minute (RNF-03), at most `MAX_BATCH_SIZE` emails per pass and over one pooled SMTP
 * connection (mailer.ts); the first attempt of each email runs right after its request with after(). Without `SMTP_HOST` the emails wait in the outbox and the worker does not start (docs/deploy.md, "Correo").
 */
export function startEmailWorker(): void {
  if (!process.env.SMTP_HOST) return;

  startJob({
    name: EMAIL_WORKER_JOB,
    intervalMs: DELIVER_INTERVAL_MS,
    run: retryOutbox,
    onError: logDeliveryFailure,
  });
}

async function retryOutbox(): Promise<void> {
  await deliverEmailsNow();
}

/** Delivers every email that is due, with a sender built from the current environment; answers how many left. */
export async function deliverEmailsNow(): Promise<number> {
  return deliverPendingEmails(createSmtpSender());
}

async function logDeliveryFailure(cause: unknown): Promise<void> {
  const message = cause instanceof Error ? cause.message : "Unknown error";

  await logServerEvent("error", "worker", `Email outbox delivery failed: ${message}`);
}

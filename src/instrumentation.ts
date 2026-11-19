import type { Instrumentation } from "next";
import type { SendEmail } from "@shared/lib/server/email-outbox";

type DeliverPendingEmails = (send: SendEmail) => Promise<number>;

const DELIVER_INTERVAL_MS = 60_000;

// Records console.error and console.warn in the server logs (S4) and purges the logs older than 30 days. It watches the
// load of the server for the automatic close of the public bracket (RF-74) and retries the email outbox
// (RNF-03); the first attempt of each email runs right after its request with after(). It also bounds the shutdown,
// so SIGTERM always ends in an exit that closes SQLite (docs/deploy.md, "Restaurar").
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startShutdownDeadline } = await import("@shared/lib/server/shutdown-deadline");

  startShutdownDeadline();

  const { installConsoleCapture } = await import("@shared/lib/server/console-capture");
  const { startServerLogRetention } = await import("@shared/lib/server/server-log-retention");

  installConsoleCapture();
  startServerLogRetention();

  const { startOverloadWatch } = await import("@features/admin/lib/server/overload-watch");

  startOverloadWatch();

  if (!process.env.SMTP_HOST) return;

  const { deliverPendingEmails } = await import("@shared/lib/server/email-outbox");
  const { createSmtpSender } = await import("@shared/lib/server/mailer");
  const send = createSmtpSender();

  const timer = setInterval(() => {
    void processOutbox(deliverPendingEmails, send);
  }, DELIVER_INTERVAL_MS);

  timer.unref();
}

// An error that Next.js caught in a request becomes a production emergency email (S20), when EMERGENCY_MAIL is set.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { describeRequestError, sendEmergencyAlert } = await import("@shared/lib/server/emergency-alert");
  const { logRequestError } = await import("@shared/lib/server/request-error-log");

  await logRequestError(error, request, context);
  await sendEmergencyAlert(describeRequestError(error, request, context));
};

async function processOutbox(deliverPendingEmails: DeliverPendingEmails, send: SendEmail): Promise<void> {
  try {
    await deliverPendingEmails(send);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unknown error";
    const { logServerEvent } = await import("@shared/lib/server/server-log");

    await logServerEvent("error", "worker", `Email outbox delivery failed: ${message}`);
  }
}

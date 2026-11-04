import type { SendEmail } from "@shared/lib/server/email-outbox";

type DeliverPendingEmails = (send: SendEmail) => Promise<number>;

const DELIVER_INTERVAL_MS = 60_000;

// Watches the load of the server for the automatic close of the public bracket (RF-74) and retries the email outbox
// (RNF-03); the first attempt of each email runs right after its request with after().
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

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

async function processOutbox(deliverPendingEmails: DeliverPendingEmails, send: SendEmail): Promise<void> {
  try {
    await deliverPendingEmails(send);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unknown error";

    console.error(`Email outbox delivery failed: ${message}`);
  }
}

import "server-only";
import { deliverEmail } from "@shared/lib/server/email-outbox";
import { createSmtpSender } from "@shared/lib/server/mailer";

/**
 * Sends a queued email right after the response (`after()`). A failure never reaches the person: the row stays in the
 * outbox and the interval of `instrumentation.ts` retries it. Only the message is logged, because a mailer error can
 * carry the address.
 */
export async function deliverQueuedEmail(emailId: string): Promise<void> {
  try {
    await deliverEmail(emailId, createSmtpSender());
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unknown error";

    console.error(`Email delivery failed: ${message}`);
  }
}

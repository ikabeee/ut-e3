import "server-only";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { SendEmail } from "@shared/lib/server/email-outbox";
import { createSmtpSender } from "@shared/lib/server/mailer";

const COPY = ADMIN_COPY.recovery;

/**
 * Sends one test email straight through SMTP, never through the outbox, so the answer is the real result of the
 * server. Answers null when it left and the exact message of the error when it did not (a missing variable, a refused
 * connection, a rejected password): that message is what the sysadmin needs to fix the configuration.
 */
export async function sendSmtpTest(to: string, send?: SendEmail): Promise<string | null> {
  try {
    await (send ?? createSmtpSender())({ to, subject: COPY.testSubject, text: COPY.testText });

    return null;
  } catch (cause) {
    return cause instanceof Error ? cause.message : String(cause);
  }
}

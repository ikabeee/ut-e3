import "server-only";

import type { Prisma } from "@generated/prisma/client";
import type { EmailOrigin } from "@shared/lib/email-kinds";
import { getPrisma } from "@shared/lib/server/prisma";
import { logServerEvent, maskEmail } from "@shared/lib/server/server-log";

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
}

export type SendEmail = (email: OutgoingEmail) => Promise<void>;

interface PendingOutboxClaim {
  id: string;
  attempts: number;
  to: string;
  kind: string | null;
}

type DeliveryFailure = "failed" | "abandoned";

interface SmtpRateLimitPayload {
  response: string;
}

interface SmtpStatusPayload {
  responseCode: number;
}

/** After this many attempts a row is abandoned: it counts as failed in the server status (RF-73). */
export const MAX_ATTEMPTS = 5;

/**
 * Gmail answers `421 4.7.0 Try again later` when the account sends too much in a short time, and it keeps answering
 * for a while: retrying within minutes only spends the attempts. These are the waits after the 1st, 2nd, 3rd and 4th
 * failed attempt, so the 5 attempts of an email span hours; later attempts keep the last wait.
 */
const RETRY_DELAYS_MS = [15 * 60_000, 30 * 60_000, 60 * 60_000, 2 * 60 * 60_000];

/** Emails sent in one pass (a pass runs every minute); the mailer also spaces them out (mailer.ts). */
export const MAX_BATCH_SIZE = 10;

// 10-minute lease gives slow SMTP deliveries enough headroom so concurrent workers do not claim in-flight sends.
const LEASE_DURATION_MS = 10 * 60_000;

export async function enqueueEmail(
  transaction: Prisma.TransactionClient,
  email: OutgoingEmail,
  origin?: EmailOrigin,
): Promise<string> {
  const row = await transaction.emailOutbox.create({
    data: {
      to: email.to,
      subject: email.subject,
      text: email.text,
      kind: origin?.kind,
      referenceId: origin?.referenceId,
    },
  });

  return row.id;
}

export async function deliverEmail(id: string, send: SendEmail, now: Date = new Date()): Promise<void> {
  await deliverEmailWithResult(id, send, now);
}

/**
 * Sends the due emails, the oldest first, at most `MAX_BATCH_SIZE`. A temporary failure ends the pass: the provider is
 * refusing or unreachable, and trying the other emails now would only spend their attempts too. A permanent failure of
 * one recipient does not stop the others. Answers how many emails left.
 */
export async function deliverPendingEmails(send: SendEmail, now: Date = new Date()): Promise<number> {
  const pendingRows = await getPrisma().emailOutbox.findMany({
    where: {
      sentAt: null,
      attempts: { lt: MAX_ATTEMPTS },
      nextAttemptAt: { lte: now },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: MAX_BATCH_SIZE,
  });

  let sentCount = 0;

  for (const { id } of pendingRows) {
    const outcome = await deliverEmailWithResult(id, send, now);

    if (outcome === "sent") {
      sentCount++;
    }

    if (outcome === "retry_later") break;
  }

  return sentCount;
}

type DeliveryOutcome = "sent" | "skipped" | "retry_later" | "abandoned";

async function deliverEmailWithResult(id: string, send: SendEmail, now: Date): Promise<DeliveryOutcome> {
  const isClaimed = await claimPendingRow(id, now);

  if (!isClaimed) {
    return "skipped";
  }

  const row = await getPrisma().emailOutbox.findUnique({
    where: { id },
  });

  if (!row) {
    return "skipped";
  }

  try {
    await send({ to: row.to, subject: row.subject, text: row.text });
  } catch (cause) {
    const isTemporary = isTemporaryEmailError(cause);

    await handleDeliveryFailure({ id, attempts: row.attempts, to: row.to, kind: row.kind }, cause, now);

    return isTemporary ? "retry_later" : "abandoned";
  }

  try {
    await getPrisma().emailOutbox.update({
      where: { id },
      data: {
        sentAt: now,
        text: "",
        lastError: null,
      },
    });

    await logServerEvent("info", "email", `Email sent: ${row.kind ?? "other"}`, {
      emailId: id,
      to: maskEmail(row.to),
    });

    return "sent";
  } catch (cause) {
    const message = formatErrorMessage(cause);

    console.error(`Email outbox sentAt update failed: ${message}`);
    throw cause;
  }
}

// Atomically claim the pending row by leasing nextAttemptAt forward so concurrent workers skip it.
async function claimPendingRow(id: string, now: Date): Promise<boolean> {
  const claimTime = new Date();
  const leasedUntil = new Date(claimTime.getTime() + LEASE_DURATION_MS);

  const claimResult = await getPrisma().emailOutbox.updateMany({
    where: {
      id,
      sentAt: null,
      attempts: { lt: MAX_ATTEMPTS },
      nextAttemptAt: { lte: now },
    },
    data: {
      nextAttemptAt: leasedUntil,
    },
  });

  return claimResult.count === 1;
}

async function handleDeliveryFailure(claim: PendingOutboxClaim, cause: unknown, now: Date): Promise<void> {
  const errorMessage = formatErrorMessage(cause);
  const temporary = isTemporaryEmailError(cause);

  if (!temporary) {
    await getPrisma().emailOutbox.update({
      where: { id: claim.id },
      data: {
        attempts: MAX_ATTEMPTS,
        lastError: errorMessage,
        text: "",
      },
    });
    await logDeliveryFailure(claim, "abandoned", errorMessage);

    return;
  }

  const nextAttempts = claim.attempts + 1;

  if (nextAttempts >= MAX_ATTEMPTS) {
    await getPrisma().emailOutbox.update({
      where: { id: claim.id },
      data: {
        attempts: nextAttempts,
        lastError: errorMessage,
        text: "",
      },
    });
    await logDeliveryFailure(claim, "abandoned", errorMessage);

    return;
  }

  const delayMs = getRetryDelayMs(nextAttempts);
  const nextAttemptAt = new Date(now.getTime() + delayMs);

  await getPrisma().emailOutbox.update({
    where: { id: claim.id },
    data: {
      attempts: nextAttempts,
      lastError: errorMessage,
      nextAttemptAt,
    },
  });
  await logDeliveryFailure(claim, "failed", errorMessage);
}

// A failed attempt will be retried (warn); an abandoned one never leaves again without a sysadmin (error).
async function logDeliveryFailure(claim: PendingOutboxClaim, outcome: DeliveryFailure, reason: string): Promise<void> {
  await logServerEvent(
    outcome === "abandoned" ? "error" : "warn",
    "email",
    `Email ${outcome}: ${claim.kind ?? "other"}`,
    {
      emailId: claim.id,
      to: maskEmail(claim.to),
      attempts: outcome === "abandoned" ? MAX_ATTEMPTS : claim.attempts + 1,
      reason,
    },
  );
}

/** The wait after `attempts` failed attempts: between half of the schedule and all of it, so the jitter never makes it short. */
export function getRetryDelayMs(attempts: number, random: () => number = Math.random): number {
  const scheduleIndex = Math.min(Math.max(0, attempts - 1), RETRY_DELAYS_MS.length - 1);

  return RETRY_DELAYS_MS[scheduleIndex] * (0.5 + 0.5 * random());
}

export function isTemporaryEmailError(cause: unknown): boolean {
  if (hasRateLimitResponse(cause)) {
    return true;
  }

  if (hasSmtpResponseCode(cause)) {
    if (isSmtpAuthFailure(cause.responseCode)) {
      return true;
    }

    return cause.responseCode >= 400 && cause.responseCode < 500;
  }

  return true;
}

function isSmtpAuthFailure(responseCode: number): boolean {
  return responseCode === 530 || responseCode === 535;
}

function hasRateLimitResponse(cause: unknown): cause is SmtpRateLimitPayload {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "response" in cause &&
    typeof cause.response === "string" &&
    cause.response.includes("4.7.28")
  );
}

function hasSmtpResponseCode(cause: unknown): cause is SmtpStatusPayload {
  return (
    typeof cause === "object" && cause !== null && "responseCode" in cause && typeof cause.responseCode === "number"
  );
}

function formatErrorMessage(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }

  return String(cause);
}

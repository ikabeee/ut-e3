import "server-only";

import type { Prisma } from "@generated/prisma/client";
import { getPrisma } from "@shared/lib/server/prisma";

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
}

export type SendEmail = (email: OutgoingEmail) => Promise<void>;

interface PendingOutboxClaim {
  id: string;
  attempts: number;
}

interface SmtpRateLimitPayload {
  response: string;
}

interface SmtpStatusPayload {
  responseCode: number;
}

const MAX_ATTEMPTS = 5;

const BASE_RETRY_DELAY_MS = 30_000;

const MAX_RETRY_DELAY_MS = 15 * 60_000;

const LEASE_DURATION_MS = 2 * 60_000;

export async function enqueueEmail(transaction: Prisma.TransactionClient, email: OutgoingEmail): Promise<string> {
  const row = await transaction.emailOutbox.create({
    data: {
      to: email.to,
      subject: email.subject,
      text: email.text,
    },
  });

  return row.id;
}

export async function deliverEmail(id: string, send: SendEmail, now: Date = new Date()): Promise<void> {
  await deliverEmailWithResult(id, send, now);
}

export async function deliverPendingEmails(send: SendEmail, now: Date = new Date()): Promise<number> {
  const pendingRows = await getPrisma().emailOutbox.findMany({
    where: {
      sentAt: null,
      attempts: { lt: MAX_ATTEMPTS },
      nextAttemptAt: { lte: now },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  let sentCount = 0;

  for (const { id } of pendingRows) {
    const wasDelivered = await deliverEmailWithResult(id, send, now);

    if (wasDelivered) {
      sentCount++;
    }
  }

  return sentCount;
}

async function deliverEmailWithResult(id: string, send: SendEmail, now: Date): Promise<boolean> {
  const isClaimed = await claimPendingRow(id, now);

  if (!isClaimed) {
    return false;
  }

  const row = await getPrisma().emailOutbox.findUnique({
    where: { id },
  });

  if (!row) {
    return false;
  }

  try {
    await send({ to: row.to, subject: row.subject, text: row.text });

    await getPrisma().emailOutbox.update({
      where: { id },
      data: {
        sentAt: now,
        lastError: null,
      },
    });

    return true;
  } catch (cause) {
    await handleDeliveryFailure({ id, attempts: row.attempts }, cause, now);

    return false;
  }
}

// Atomically claim the pending row by leasing nextAttemptAt forward so concurrent workers skip it.
async function claimPendingRow(id: string, now: Date): Promise<boolean> {
  const leasedUntil = new Date(now.getTime() + LEASE_DURATION_MS);

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

  if (temporary) {
    const nextAttempts = claim.attempts + 1;
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

    return;
  }

  await getPrisma().emailOutbox.update({
    where: { id: claim.id },
    data: {
      attempts: MAX_ATTEMPTS,
      lastError: errorMessage,
    },
  });
}

export function getRetryDelayMs(attempts: number, random: () => number = Math.random): number {
  const exponent = Math.max(0, attempts - 1);
  const exponentialDelay = BASE_RETRY_DELAY_MS * 2 ** exponent;
  const cappedDelay = Math.min(exponentialDelay, MAX_RETRY_DELAY_MS);

  return random() * cappedDelay;
}

export function isTemporaryEmailError(cause: unknown): boolean {
  if (hasRateLimitResponse(cause)) {
    return true;
  }

  if (hasSmtpResponseCode(cause)) {
    return cause.responseCode >= 400 && cause.responseCode < 500;
  }

  return true;
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

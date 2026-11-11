import "server-only";

import { randomBytes } from "node:crypto";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { getClaimPath } from "@features/visitors/lib/visitors-links";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { enqueueEmail } from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";
import { consumeAttempt, type RateLimitRule } from "@shared/lib/server/rate-limit";
import { hashToken } from "@shared/lib/server/token-hash";
import { createVisitorDevice } from "@shared/lib/server/visitor-device";
import { siteConfig } from "@shared/lib/site-config";

// RF-68: three requests per email per hour, counted whether or not the email has a passport.
export const EMAIL_RECOVERY_RULE: RateLimitRule = { limit: 3, windowMs: 60 * 60 * 1000 };

export const RECOVERY_LINK_LIFETIME_MS = 30 * 60 * 1000;

const TOKEN_BYTES = 32;

/**
 * Queues the recovery email of the passport registered with `email` and returns the id of the queued email, or null
 * when nothing is sent (no such passport, or the limit of the hour is used up). The caller runs it after answering,
 * so neither the answer nor its timing tells whether the email exists.
 */
export async function requestEmailRecovery(email: string, now: Date): Promise<string | null> {
  if (!(await consumeAttempt(`recovery-email:${email}`, EMAIL_RECOVERY_RULE, now))) return null;

  // visitors.email compares with COLLATE NOCASE.
  const visitor = await getPrisma().visitor.findFirst({ where: { email }, select: { id: true, email: true } });

  if (!visitor) return null;

  return getPrisma().$transaction((transaction) => issueEmailLink(transaction, visitor, now));
}

/** Whether the link can still be used, without using it: opening the link only reads, the visitor confirms after. */
export async function isUsableRecoveryToken(token: string, now: Date): Promise<boolean> {
  const row = await getPrisma().recoveryToken.findFirst({
    where: { token: hashToken(token), usedAt: null, expiresAt: { gt: now } },
    select: { id: true },
  });

  return row !== null;
}

/**
 * Uses a recovery link once (RF-68): an unused token younger than 30 minutes gives the passport a new device, which
 * replaces the previous one (RF-70), and the recovery is audited in the same transaction. Returns the token of the new
 * device, or null for an expired, used or unknown link.
 */
export async function claimRecoveryToken(token: string, now: Date): Promise<string | null> {
  const hashed = hashToken(token);

  return getPrisma().$transaction(async (transaction) => {
    // The conditional update is what makes the link single-use: of two phones that open it, only one changes the row.
    const { count } = await transaction.recoveryToken.updateMany({
      where: { token: hashed, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });

    if (count !== 1) return null;

    const { visitorId, channel } = await transaction.recoveryToken.findUniqueOrThrow({
      where: { token: hashed },
      select: { visitorId: true, channel: true },
    });

    const deviceToken = await createVisitorDevice(transaction, visitorId);

    await recordAudit(transaction, {
      actorId: null,
      action: "passport_recovered",
      entityType: "visitor",
      entityId: visitorId,
      detail: { channel },
    });

    return deviceToken;
  });
}

async function issueEmailLink(
  transaction: Prisma.TransactionClient,
  visitor: { id: string; email: string },
  now: Date,
): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");

  await transaction.recoveryToken.create({
    data: {
      visitorId: visitor.id,
      token: hashToken(token),
      channel: "email",
      expiresAt: new Date(now.getTime() + RECOVERY_LINK_LIFETIME_MS),
    },
  });

  await recordAudit(transaction, {
    actorId: null,
    action: "passport_recovery_requested",
    entityType: "visitor",
    entityId: visitor.id,
    detail: { channel: "email" },
  });

  return enqueueEmail(transaction, {
    to: visitor.email,
    subject: VISITORS_COPY.recovery.email.subject,
    text: VISITORS_COPY.recovery.email.body(`${siteConfig.url}${getClaimPath(token)}`),
  });
}

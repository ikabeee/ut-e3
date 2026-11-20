import "server-only";

import { randomBytes } from "node:crypto";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { getClaimPath } from "@features/visitors/lib/visitors-links";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { enqueueEmail } from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";
import { hashToken } from "@shared/lib/server/token-hash";
import { createVisitorDevice } from "@shared/lib/server/visitor-device";
import { siteConfig } from "@shared/lib/site-config";

export const RECOVERY_LINK_LIFETIME_MS = 30 * 60 * 1000;

const TOKEN_BYTES = 32;

/**
 * Queues the recovery email of the passport registered with `email` and returns the id of the queued email, or null
 * when nothing is sent (no such passport). The caller runs it after answering,
 * so neither the answer nor its timing tells whether the email exists.
 */
export async function requestEmailRecovery(email: string, now: Date): Promise<string | null> {
  // visitors.email compares with COLLATE NOCASE.
  const visitor = await getPrisma().visitor.findFirst({ where: { email }, select: { id: true, email: true } });

  if (!visitor) return null;

  return getPrisma().$transaction((transaction) => issueEmailLink(transaction, visitor, { now }));
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

/** A new recovery link for a visitor whose email was abandoned; the previous link stays valid until it expires. */
export async function rebuildRecoveryEmail(
  transaction: Prisma.TransactionClient,
  visitorId: string,
  now: Date,
): Promise<string | null> {
  const visitor = await transaction.visitor.findUnique({ where: { id: visitorId }, select: { id: true, email: true } });

  return visitor ? issueEmailLink(transaction, visitor, { now }) : null;
}

/**
 * Creates the one-use link and queues its email, in the transaction of the caller. `issuance.actorId` is the sysadmin who
 * asked for it; a visitor's own request leaves it empty. The 3-per-hour limit belongs to the self-service request, not here.
 */
export async function issueEmailLink(
  transaction: Prisma.TransactionClient,
  visitor: { id: string; email: string },
  issuance: { now: Date; actorId?: string | null },
): Promise<string> {
  const { now, actorId = null } = issuance;

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
    actorId,
    action: "passport_recovery_requested",
    entityType: "visitor",
    entityId: visitor.id,
    detail: { channel: "email" },
  });

  const email = {
    to: visitor.email,
    subject: VISITORS_COPY.recovery.email.subject,
    text: VISITORS_COPY.recovery.email.body(`${siteConfig.url}${getClaimPath(token)}`),
  };

  return enqueueEmail(transaction, email, { kind: "recovery_link", referenceId: visitor.id });
}

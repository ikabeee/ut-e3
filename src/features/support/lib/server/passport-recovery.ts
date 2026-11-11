import "server-only";
import { normalizeFullName, type RecoveryInput } from "@features/support/lib/recovery-input";
import { getClaimPath } from "@features/visitors/lib/visitors-links";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";
import { consumeAttempt, type RateLimitRule } from "@shared/lib/server/rate-limit";
import { createVisitorDevice } from "@shared/lib/server/visitor-device";

export type RecoveryResult =
  | { status: "recovered"; fullName: string; gamertag: string; registeredAt: Date; claimPath: string }
  | { status: "identityMismatch" }
  | { status: "visitorLimit" };

// A desk serves one person at a time; the limit stops an agent (or a stolen session) from trying names in bulk.
export const AGENT_RULE: RateLimitRule = { limit: 30, windowMs: 10 * 60 * 1000 };

export const VISITOR_RULE: RateLimitRule = { limit: 3, windowMs: 60 * 60 * 1000 };

interface MatchedVisitor {
  id: string;
  fullName: string;
  gamertag: string;
  createdAt: Date;
}

/**
 * Issues a new device for the visitor whose full name and gamertag match (RF-69); the previous device loses access
 * because a visitor has a single one (RF-18 and RF-70). Every outcome is audited in the transaction of the change, and
 * a mismatch is recorded without saying whether the gamertag exists.
 */
export async function recoverPassport(agentId: string, input: RecoveryInput, now: Date): Promise<RecoveryResult> {
  const visitor = await findVisitor(input);

  if (!visitor) {
    await auditMismatch(agentId, input);

    return { status: "identityMismatch" };
  }

  if (!(await consumeAttempt(`recovery-visitor:${visitor.id}`, VISITOR_RULE, now))) {
    await getPrisma().$transaction((transaction) => auditLimit(transaction, agentId, visitor));

    return { status: "visitorLimit" };
  }

  return getPrisma().$transaction((transaction) => replaceDevice(transaction, agentId, visitor));
}

// The gamertag column compares without regard to case and is unique, so one row at most can match.
async function findVisitor(input: RecoveryInput): Promise<MatchedVisitor | null> {
  const visitor = await getPrisma().visitor.findFirst({
    where: { gamertag: input.gamertag },
    select: { id: true, fullName: true, gamertag: true, createdAt: true },
  });

  return visitor && normalizeFullName(visitor.fullName) === normalizeFullName(input.fullName) ? visitor : null;
}

async function replaceDevice(
  transaction: Prisma.TransactionClient,
  agentId: string,
  visitor: MatchedVisitor,
): Promise<RecoveryResult> {
  const token = await createVisitorDevice(transaction, visitor.id);

  await recordAudit(transaction, {
    actorId: agentId,
    action: "passport_recovered",
    entityType: "visitor",
    entityId: visitor.id,
    detail: { gamertag: visitor.gamertag },
  });

  return {
    status: "recovered",
    fullName: visitor.fullName,
    gamertag: visitor.gamertag,
    registeredAt: visitor.createdAt,
    claimPath: getClaimPath(token),
  };
}

async function auditLimit(transaction: Prisma.TransactionClient, agentId: string, visitor: MatchedVisitor) {
  await recordAudit(transaction, {
    actorId: agentId,
    action: "passport_recovery_limited",
    entityType: "visitor",
    entityId: visitor.id,
    detail: { gamertag: visitor.gamertag },
  });
}

// No visitor id exists to point at, so the entry names the gamertag that was typed.
async function auditMismatch(agentId: string, input: RecoveryInput): Promise<void> {
  await getPrisma().$transaction((transaction) =>
    recordAudit(transaction, {
      actorId: agentId,
      action: "passport_recovery_failed",
      entityType: "visitor_lookup",
      entityId: input.gamertag,
      detail: { reason: "identity_mismatch" },
    }),
  );
}

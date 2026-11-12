import "server-only";
import { normalizeFullName } from "@features/support/lib/recovery-input";
import { VALID_CHECK_IN_WHERE } from "@features/visitors/lib/server/milestone-tickets";
import { getClaimPath } from "@features/visitors/lib/visitors-links";
import type { Prisma } from "@generated/prisma/client";
import { maskEmail } from "@shared/lib/mask-email";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";
import { consumeAttempt, type RateLimitRule } from "@shared/lib/server/rate-limit";
import { createVisitorDevice } from "@shared/lib/server/visitor-device";

/**
 * What the agent compares with the visitor before handing over an access. Never the PIN, and the email is masked
 * ("ca***@gmail.com") because it is only there to tell apart two people with the same name.
 */
export interface PassportCandidate {
  visitorId: string;
  fullName: string;
  gamertag: string;
  maskedEmail: string;
  registeredAt: Date;
  /** Stands visited that count (the annulled visits do not). */
  standsVisited: number;
}

export type SearchResult = { status: "found"; candidates: PassportCandidate[] } | { status: "notFound" };

export type RecoveryResult =
  | { status: "recovered"; fullName: string; gamertag: string; registeredAt: Date; claimPath: string }
  | { status: "notFound" }
  | { status: "visitorLimit" };

// A desk serves one person at a time; the limit stops an agent (or a stolen session) from trying names in bulk.
export const AGENT_RULE: RateLimitRule = { limit: 30, windowMs: 10 * 60 * 1000 };

export const VISITOR_RULE: RateLimitRule = { limit: 3, windowMs: 60 * 60 * 1000 };

/** The most passports a search lists: a name shared by more people than this needs the email or the gamertag. */
export const CANDIDATE_LIMIT = 10;

const CANDIDATE_SELECT = {
  id: true,
  fullName: true,
  gamertag: true,
  email: true,
  createdAt: true,
  _count: { select: { checkIns: { where: VALID_CHECK_IN_WHERE } } },
} satisfies Prisma.VisitorSelect;

type CandidateRow = Prisma.VisitorGetPayload<{ select: typeof CANDIDATE_SELECT }>;

interface MatchedVisitor {
  id: string;
  fullName: string;
  gamertag: string;
  createdAt: Date;
}

/**
 * Finds the passports that match what the visitor remembers (RF-69): an exact email, an exact gamertag or the full name.
 * Nothing is partial, so the desk cannot be used to browse the registered visitors. A miss is audited without saying
 * whether the data exists.
 */
export async function searchPassports(agentId: string, query: string): Promise<SearchResult> {
  const rows = (await findRows(query)).slice(0, CANDIDATE_LIMIT);

  if (rows.length === 0) {
    await auditNotFound(agentId, query);

    return { status: "notFound" };
  }

  return { status: "found", candidates: rows.map(toCandidate) };
}

/**
 * Issues a new device for the chosen visitor; the previous device loses access because a visitor has a single one
 * (RF-18 and RF-70). Every outcome is audited in the transaction of the change.
 */
export async function recoverPassport(agentId: string, visitorId: string, now: Date): Promise<RecoveryResult> {
  const visitor = await getPrisma().visitor.findUnique({
    where: { id: visitorId },
    select: { id: true, fullName: true, gamertag: true, createdAt: true },
  });

  if (!visitor) {
    await auditNotFound(agentId, visitorId);

    return { status: "notFound" };
  }

  if (!(await consumeAttempt(`recovery-visitor:${visitor.id}`, VISITOR_RULE, now))) {
    await getPrisma().$transaction((transaction) => auditLimit(transaction, agentId, visitor));

    return { status: "visitorLimit" };
  }

  return getPrisma().$transaction((transaction) => replaceDevice(transaction, agentId, visitor));
}

// The email and gamertag columns compare without regard to case; the name is matched in two steps because the
// database does not ignore accents, case and repeated spaces the way the desk needs.
async function findRows(query: string): Promise<CandidateRow[]> {
  const prisma = getPrisma();

  if (query.includes("@")) {
    return prisma.visitor.findMany({ where: { email: query }, select: CANDIDATE_SELECT, take: CANDIDATE_LIMIT });
  }

  const byGamertag = await prisma.visitor.findMany({ where: { gamertag: query }, select: CANDIDATE_SELECT });
  const byName = await findByFullName(query);
  const known = new Set(byGamertag.map((row) => row.id));

  return [...byGamertag, ...byName.filter((row) => !known.has(row.id))];
}

async function findByFullName(query: string): Promise<CandidateRow[]> {
  const words = normalizeFullName(query).split(" ");

  const rows = await getPrisma().visitor.findMany({
    where: { AND: words.map((word) => ({ fullName: { contains: word } })) },
    select: CANDIDATE_SELECT,
    orderBy: { createdAt: "asc" },
  });

  return rows.filter((row) => normalizeFullName(row.fullName) === normalizeFullName(query));
}

function toCandidate(row: CandidateRow): PassportCandidate {
  return {
    visitorId: row.id,
    fullName: row.fullName,
    gamertag: row.gamertag,
    maskedEmail: maskEmail(row.email),
    registeredAt: row.createdAt,
    standsVisited: row._count.checkIns,
  };
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

// No visitor exists to point at, so the entry names what was typed, unless it is an email or a name with spaces: those
// are personal data and are not copied to the log.
async function auditNotFound(agentId: string, typed: string): Promise<void> {
  await getPrisma().$transaction((transaction) =>
    recordAudit(transaction, {
      actorId: agentId,
      action: "passport_recovery_failed",
      entityType: "visitor_lookup",
      entityId: describeTyped(typed),
      detail: { reason: "not_found" },
    }),
  );
}

function describeTyped(typed: string): string {
  if (typed.includes("@")) return "email";

  return typed.includes(" ") ? "name" : typed;
}

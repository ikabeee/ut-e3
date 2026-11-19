import "server-only";
import { randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { enqueueEmail } from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";
import { consumeAttempt, type RateLimitRule } from "@shared/lib/server/rate-limit";
import { hashToken } from "@shared/lib/server/token-hash";

export interface ChallengeAccount {
  id: string;
  email: string;
  name: string;
}

export type StartResult = { status: "sent"; emailId: string; token: string } | { status: "rateLimited" };

export type ResendResult = { status: "sent"; emailId: string } | { status: "rateLimited" } | { status: "invalid" };

export type VerifyResult = { status: "verified"; accountId: string; role: string } | { status: "invalid" };

export const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;

/** Wrong codes a challenge accepts; after them it refuses every code, the right one too. */
export const MAX_CODE_ATTEMPTS = 5;

/** A challenge can ask for new codes only while it is this young, so a stolen cookie does not live on. */
export const CHALLENGE_LIFETIME_MS = 30 * 60 * 1000;

// Counts the first code and each resend, per account: whoever knows the password cannot flood the inbox.
export const LOGIN_CODE_SEND_RULE: RateLimitRule = { limit: 3, windowMs: 10 * 60 * 1000 };

const TOKEN_BYTES = 32;

const CODE_DIGITS = 6;

/**
 * Starts the second step of a sign-in: replaces the pending challenge of the account, queues the email with the code and
 * returns the token that goes in the challenge cookie (S2). Only the SHA-256 of the token and of the code is stored.
 */
export async function startLoginChallenge(account: ChallengeAccount, now: Date): Promise<StartResult> {
  if (!(await consumeAttempt(sendKey(account.id), LOGIN_CODE_SEND_RULE, now))) return { status: "rateLimited" };

  const token = randomBytes(TOKEN_BYTES).toString("base64url");

  return getPrisma().$transaction(async (transaction): Promise<StartResult> => {
    await transaction.loginChallenge.deleteMany({ where: { accountId: account.id } });

    const challengeId = randomUUID();
    const code = generateCode();

    await transaction.loginChallenge.create({
      data: {
        id: challengeId,
        accountId: account.id,
        token: hashToken(token),
        codeHash: hashCode(challengeId, code),
        expiresAt: new Date(now.getTime() + LOGIN_CODE_TTL_MS),
        createdAt: now,
      },
    });

    const emailId = await enqueueCodeEmail(transaction, account, code);

    await recordAudit(transaction, auditOf(account.id, "account.login_code_sent", {}));

    return { status: "sent", emailId, token };
  });
}

/** A new code for the pending challenge: the previous code stops working and the wrong attempts start again. */
export async function resendLoginCode(token: string, now: Date): Promise<ResendResult> {
  const challenge = await getPrisma().loginChallenge.findFirst({
    where: {
      token: hashToken(token),
      usedAt: null,
      createdAt: { gt: new Date(now.getTime() - CHALLENGE_LIFETIME_MS) },
      account: { status: "active" },
    },
    select: { id: true, account: { select: { id: true, email: true, name: true } } },
  });

  if (!challenge) return { status: "invalid" };

  const { account } = challenge;

  if (!(await consumeAttempt(sendKey(account.id), LOGIN_CODE_SEND_RULE, now))) return { status: "rateLimited" };

  return getPrisma().$transaction(async (transaction): Promise<ResendResult> => {
    const code = generateCode();

    const renewed = await transaction.loginChallenge.updateMany({
      where: { id: challenge.id, usedAt: null },
      data: {
        codeHash: hashCode(challenge.id, code),
        attempts: 0,
        expiresAt: new Date(now.getTime() + LOGIN_CODE_TTL_MS),
      },
    });

    if (renewed.count !== 1) return { status: "invalid" };

    const emailId = await enqueueCodeEmail(transaction, account, code);

    await recordAudit(transaction, auditOf(account.id, "account.login_code_resent", {}));

    return { status: "sent", emailId };
  });
}

/**
 * Checks the code of a challenge. Wrong, expired, used, exhausted and unknown all answer `invalid`, so the answer does
 * not tell which one it was. The attempt is spent before the comparison, so concurrent guesses cannot exceed the maximum,
 * and the code is single-use: of two requests with the right code only one wins.
 */
export async function verifyLoginCode(token: string, code: string, now: Date): Promise<VerifyResult> {
  const challenge = await getPrisma().loginChallenge.findUnique({
    where: { token: hashToken(token) },
    select: { id: true, codeHash: true, accountId: true, account: { select: { role: true } } },
  });

  if (!challenge) return { status: "invalid" };

  return getPrisma().$transaction(async (transaction): Promise<VerifyResult> => {
    const spent = await transaction.loginChallenge.updateMany({
      where: {
        id: challenge.id,
        usedAt: null,
        attempts: { lt: MAX_CODE_ATTEMPTS },
        expiresAt: { gt: now },
        account: { status: "active" },
      },
      data: { attempts: { increment: 1 } },
    });

    if (spent.count !== 1) return { status: "invalid" };

    if (!isSameHash(hashCode(challenge.id, code), challenge.codeHash)) {
      await recordAudit(transaction, auditOf(challenge.accountId, "account.login_code_failed", {}));

      return { status: "invalid" };
    }

    const used = await transaction.loginChallenge.updateMany({
      where: { id: challenge.id, usedAt: null },
      data: { usedAt: now },
    });

    if (used.count !== 1) return { status: "invalid" };

    await recordAudit(transaction, auditOf(challenge.accountId, "account.login_verified", {}));

    return { status: "verified", accountId: challenge.accountId, role: challenge.account.role };
  });
}

function enqueueCodeEmail(transaction: Prisma.TransactionClient, account: ChallengeAccount, code: string) {
  const email = {
    to: account.email,
    subject: ACCOUNTS_COPY.loginCodeEmail.subject,
    text: ACCOUNTS_COPY.loginCodeEmail.body(account.name, code),
  };

  return enqueueEmail(transaction, email, { kind: "login_code", referenceId: account.id });
}

function generateCode(): string {
  return randomInt(0, 10 ** CODE_DIGITS)
    .toString()
    .padStart(CODE_DIGITS, "0");
}

// The challenge id is part of the hash, so two challenges with the same code do not share a hash.
function hashCode(challengeId: string, code: string): string {
  return hashToken(`${challengeId}:${code}`);
}

// Both are SHA-256 hex strings of the same length; the comparison takes the same time wherever they differ.
function isSameHash(candidate: string, stored: string): boolean {
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(stored));
}

function sendKey(accountId: string): string {
  return `login-code:${accountId}`;
}

// The audit detail never carries the code or the email address.
function auditOf(accountId: string, action: string, detail: Prisma.InputJsonValue) {
  return { actorId: accountId, action, entityType: "account", entityId: accountId, detail };
}

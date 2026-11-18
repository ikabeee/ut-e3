import "server-only";
import { randomBytes } from "node:crypto";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { RESET_PASSWORD_PATH } from "@features/accounts/lib/accounts-links";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { enqueueEmail } from "@shared/lib/server/email-outbox";
import { hashPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";
import { consumeAttempt, type RateLimitRule } from "@shared/lib/server/rate-limit";
import { hashToken } from "@shared/lib/server/token-hash";
import { siteConfig } from "@shared/lib/site-config";

export type ResetLinkState = { status: "valid"; name: string } | { status: "expired" | "invalid" };

export type ResetResult = { status: "changed" | "expired" | "invalid" };

export const RESET_LINK_LIFETIME_MS = 60 * 60 * 1000;

// Three requests per email per hour, counted whether or not the email has an account.
export const PASSWORD_RESET_RULE: RateLimitRule = { limit: 3, windowMs: 60 * 60 * 1000 };

const TOKEN_BYTES = 32;

const ACTIVE = "active";

/**
 * Queues the reset email of the active account with `email` and returns the id of the queued email, or null when nothing
 * is sent (no active account, or the limit of the hour is used up). The caller runs it after answering, so neither the
 * answer nor its timing tells whether the email has an account. The previous unused link stops working.
 */
export async function requestPasswordReset(email: string, now: Date): Promise<string | null> {
  if (!(await consumeAttempt(`password-reset:${email}`, PASSWORD_RESET_RULE, now))) return null;

  const account = await getPrisma().account.findFirst({
    where: { email, status: ACTIVE },
    select: { id: true, email: true, name: true },
  });

  if (!account) return null;

  return getPrisma().$transaction((transaction) => issueResetLink(transaction, account, now));
}

/**
 * Sets the new password, uses the link up and closes every session of the account, in one transaction. The conditional
 * update makes the link single-use: of two simultaneous requests only one changes the row.
 */
export async function resetPassword(token: string, password: string, now: Date): Promise<ResetResult> {
  const state = await getResetLinkState(token, now);

  if (state.status !== "valid") return { status: state.status };

  const passwordHash = await hashPassword(password);
  const hashed = hashToken(token);

  return getPrisma().$transaction(async (transaction): Promise<ResetResult> => {
    const used = await transaction.passwordResetToken.updateMany({
      where: { token: hashed, usedAt: null, expiresAt: { gt: now }, account: { status: ACTIVE } },
      data: { usedAt: now },
    });

    if (used.count !== 1) return { status: "invalid" };

    const { accountId } = await transaction.passwordResetToken.findUniqueOrThrow({
      where: { token: hashed },
      select: { accountId: true },
    });

    await transaction.account.update({ where: { id: accountId }, data: { password: passwordHash } });
    await transaction.session.deleteMany({ where: { accountId } });
    await transaction.loginChallenge.deleteMany({ where: { accountId } });
    await recordAudit(transaction, auditOf(accountId, "account.password_reset"));

    return { status: "changed" };
  });
}

/** What the reset page can say about a link, without using it; an unknown or used link is `invalid`. */
export async function getResetLinkState(token: string, now: Date): Promise<ResetLinkState> {
  const link = await getPrisma().passwordResetToken.findUnique({
    where: { token: hashToken(token) },
    select: { usedAt: true, expiresAt: true, account: { select: { name: true, status: true } } },
  });

  if (!link || link.usedAt || link.account.status !== ACTIVE) return { status: "invalid" };

  return link.expiresAt <= now ? { status: "expired" } : { status: "valid", name: link.account.name };
}

async function issueResetLink(
  transaction: Prisma.TransactionClient,
  account: { id: string; email: string; name: string },
  now: Date,
): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");

  await transaction.passwordResetToken.deleteMany({ where: { accountId: account.id, usedAt: null } });
  await transaction.passwordResetToken.create({
    data: {
      accountId: account.id,
      token: hashToken(token),
      expiresAt: new Date(now.getTime() + RESET_LINK_LIFETIME_MS),
    },
  });
  await recordAudit(transaction, auditOf(account.id, "account.password_reset_requested"));

  return enqueueEmail(transaction, {
    to: account.email,
    subject: ACCOUNTS_COPY.passwordResetEmail.subject,
    text: ACCOUNTS_COPY.passwordResetEmail.body(account.name, `${siteConfig.url}${RESET_PASSWORD_PATH}/${token}`),
  });
}

// The audit detail never carries the email address or the token.
function auditOf(accountId: string, action: string) {
  return { actorId: accountId, action, entityType: "account", entityId: accountId, detail: {} };
}

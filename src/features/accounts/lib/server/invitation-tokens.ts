import "server-only";
import { randomBytes } from "node:crypto";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { ACTIVATE_PATH } from "@features/accounts/lib/accounts-links";
import { INVITATION_TTL_MS } from "@features/accounts/lib/invitation-rules";
import type { Prisma } from "@generated/prisma/client";
import type { OutgoingEmail } from "@shared/lib/server/email-outbox";
import { hashToken } from "@shared/lib/server/token-hash";
import { siteConfig } from "@shared/lib/site-config";

const TOKEN_BYTES = 32;

/**
 * Makes a new invitation for the account and returns the token that goes in the email. Only its SHA-256 is stored
 * (RNF-09). An account has one valid invitation: the ones that were not used are deleted.
 */
export async function issueInvitation(
  transaction: Prisma.TransactionClient,
  accountId: string,
  now: Date,
): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");

  await transaction.accountInvitation.deleteMany({ where: { accountId, usedAt: null } });
  await transaction.accountInvitation.create({
    data: { accountId, token: hashToken(token), expiresAt: new Date(now.getTime() + INVITATION_TTL_MS) },
  });

  return token;
}

export function buildInvitationEmail(to: string, name: string, token: string): OutgoingEmail {
  const link = `${siteConfig.url}${ACTIVATE_PATH}/${token}`;

  return {
    to,
    subject: ACCOUNTS_COPY.invitationEmail.subject,
    text: ACCOUNTS_COPY.invitationEmail.body(name, link),
  };
}

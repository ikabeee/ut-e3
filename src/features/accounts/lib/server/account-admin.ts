import "server-only";
import {
  findManagedAccount,
  auditOf,
  type ManageFailure,
  type ManagingActor,
} from "@features/accounts/lib/server/invitations";
import { queueResetLink, PASSWORD_RESET_RULE } from "@features/accounts/lib/server/password-reset";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";
import { consumeAttempt } from "@shared/lib/server/rate-limit";

export type SendResetResult = { status: "sent"; emailId: string } | { status: "rateLimited" } | ManageFailure;

export type CloseSessionsResult = { status: "closed"; count: number } | ManageFailure;

export type ClearChallengesResult = { status: "cleared"; count: number } | ManageFailure;

/**
 * Sends the reset link of "Olvidé mi contraseña" to an active account on behalf of the sysadmin. The self-service limit
 * exists so that anyone can be stopped from flooding an inbox; here the caller is a signed-in sysadmin, so the limit
 * is not skipped but counted in its own bucket per account: it neither spends the attempts of the owner nor can be
 * spent by them, and a repeated click still cannot flood the inbox.
 */
export async function sendAdminPasswordReset(
  actor: ManagingActor,
  accountId: string,
  now: Date,
): Promise<SendResetResult> {
  const lookup = await findSysadminTarget(actor, accountId);

  if (lookup.kind === "refused") return lookup.failure;

  const { account } = lookup;

  if (account.status !== "active") return { status: "wrongState" };

  if (!(await consumeAttempt(`admin-password-reset:${account.id}`, PASSWORD_RESET_RULE, now))) {
    return { status: "rateLimited" };
  }

  const audit = { actorId: actor.id, action: "account.admin_password_reset_sent" };

  return { status: "sent", emailId: await queueResetLink(account, audit, now) };
}

/** Deletes every session of the account, so each device has to sign in again. */
export async function closeAccountSessions(actor: ManagingActor, accountId: string): Promise<CloseSessionsResult> {
  const lookup = await findSysadminTarget(actor, accountId);

  if (lookup.kind === "refused") return lookup.failure;

  const { account } = lookup;

  return getPrisma().$transaction(async (transaction): Promise<CloseSessionsResult> => {
    const { count } = await transaction.session.deleteMany({ where: { accountId: account.id } });

    await recordAudit(transaction, { ...auditOf(actor, "account.sessions_closed", account.id), detail: { count } });

    return { status: "closed", count };
  });
}

/** Deletes the pending second-step challenges of the account, so a stuck sign-in starts again from the password. */
export async function clearPendingLoginChallenges(
  actor: ManagingActor,
  accountId: string,
): Promise<ClearChallengesResult> {
  const lookup = await findSysadminTarget(actor, accountId);

  if (lookup.kind === "refused") return lookup.failure;

  const { account } = lookup;

  return getPrisma().$transaction(async (transaction): Promise<ClearChallengesResult> => {
    const { count } = await transaction.loginChallenge.deleteMany({ where: { accountId: account.id } });

    await recordAudit(transaction, { ...auditOf(actor, "account.two_factor_cleared", account.id), detail: { count } });

    return { status: "cleared", count };
  });
}

// These tools are the sysadmin's alone, even for an account that another manager could disable.
async function findSysadminTarget(actor: ManagingActor, accountId: string) {
  if (actor.role !== "sysadmin") return { kind: "refused", failure: { status: "forbidden" } } as const;

  return findManagedAccount(actor, accountId);
}

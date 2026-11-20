import "server-only";
import {
  findManagedAccount,
  hasOtherActiveSysadmin,
  auditOf,
  type ManagedRow,
  type ManageFailure,
  type ManagingActor,
} from "@features/accounts/lib/server/invitations";
import { queueResetLink } from "@features/accounts/lib/server/password-reset";
import { isSecondaryRole } from "@features/accounts/lib/secondary-role";
import { readDatabaseMessage } from "@shared/lib/server/database-errors";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";

export type SendResetResult = { status: "sent"; emailId: string } | ManageFailure;

export type CloseSessionsResult = { status: "closed"; count: number } | ManageFailure;

export type ClearChallengesResult = { status: "cleared"; count: number } | ManageFailure;

export type SecondaryRoleResult =
  | { status: "changed"; secondaryRole: string | null }
  | { status: "invalidRole" | "notStandAdmin" | "unchanged" | "lastSysadmin" }
  | ManageFailure;

/**
 * Sends the reset link of "Olvidé mi contraseña" to an active account on behalf of the sysadmin.
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

/**
 * Gives a stand administrator a second role, replaces it or takes it away (`null`), and records it as
 * `account.secondary_role` in the same transaction (S1, S2, L14). Only the sysadmin does it, whatever the status of
 * the account, so the roles can be loaded before a leader activates the account. The last active sysadmin cannot lose
 * its secondary role sysadmin: the application checks first and the trigger of the table is the safety net.
 */
export async function setSecondaryRole(
  actor: ManagingActor,
  accountId: string,
  secondaryRole: string | null,
): Promise<SecondaryRoleResult> {
  const lookup = await findSysadminTarget(actor, accountId);

  if (lookup.kind === "refused") return lookup.failure;

  const { account } = lookup;
  const refusal = await findSecondaryRoleRefusal(account, secondaryRole);

  if (refusal) return refusal;

  try {
    return await getPrisma().$transaction(async (transaction): Promise<SecondaryRoleResult> => {
      await transaction.account.update({ where: { id: account.id }, data: { secondaryRole } });
      await recordAudit(transaction, {
        ...auditOf(actor, "account.secondary_role", account.id),
        detail: { from: account.secondaryRole, to: secondaryRole },
      });

      return { status: "changed", secondaryRole };
    });
  } catch (cause) {
    return explainSecondaryRoleFailure(cause);
  }
}

async function findSecondaryRoleRefusal(
  account: ManagedRow,
  secondaryRole: string | null,
): Promise<SecondaryRoleResult | null> {
  if (secondaryRole !== null && !isSecondaryRole(secondaryRole)) return { status: "invalidRole" };

  if (account.role !== "stand_admin") return { status: "notStandAdmin" };

  if (account.secondaryRole === secondaryRole) return { status: "unchanged" };

  const losesSysadmin = account.secondaryRole === "sysadmin" && account.status === "active";

  return losesSysadmin && !(await hasOtherActiveSysadmin(account.id)) ? { status: "lastSysadmin" } : null;
}

// Two sysadmins can pass the check together; the trigger of the table stops the second one and rolls its changes back.
function explainSecondaryRoleFailure(cause: unknown): SecondaryRoleResult {
  if (readDatabaseMessage(cause).includes("last_sysadmin")) return { status: "lastSysadmin" };

  throw cause;
}

// These tools are the sysadmin's alone, even for an account that another manager could disable.
async function findSysadminTarget(actor: ManagingActor, accountId: string) {
  if (actor.role !== "sysadmin") return { kind: "refused", failure: { status: "forbidden" } } as const;

  return findManagedAccount(actor, accountId);
}

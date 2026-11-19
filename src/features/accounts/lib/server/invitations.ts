import "server-only";
import type { InviteInput } from "@features/accounts/lib/invitation-input";
import {
  canManageAccount,
  canManageRole,
  getManagedRoles,
  isInvitationExpired,
  MAX_STAND_STAFF,
} from "@features/accounts/lib/invitation-rules";
import { buildInvitationEmail, issueInvitation } from "@features/accounts/lib/server/invitation-tokens";
import type { AccountStatus, KofDesk, ManagedAccount, StandAccountRow } from "@features/accounts/lib/types";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { isUniqueViolation, readDatabaseMessage } from "@shared/lib/server/database-errors";
import { enqueueEmail } from "@shared/lib/server/email-outbox";
import { hashPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";
import { hashToken } from "@shared/lib/server/token-hash";

export interface ManagingActor {
  id: string;
  role: string;
  /** The stand of a stand administrator, whose staff it manages; the other roles have none. */
  standId?: string | null;
}

type InviteRefusal = { status: "emailTaken" | "hasPassport" | "deskTaken" | "standFull" | "adminTaken" };

export type InviteResult =
  | { status: "invited"; accountId: string; emailId: string }
  | { status: "forbidden" | "invalidDesk" | "invalidStand" }
  | InviteRefusal;

export type ManageFailure = { status: "forbidden" | "notFound" | "wrongState" };

export type ResendResult = { status: "sent"; emailId: string } | ManageFailure;

/** The sysadmin cannot disable itself, nor the last active sysadmin: nobody could sign in to undo it. */
type DisableRefusal = { status: "selfProtected" | "lastSysadmin" };

export type DisableResult = { status: "disabled" } | DisableRefusal | ManageFailure;

type ReactivateRefusal = { status: "standFull" | "deskTaken" | "adminTaken" };

export type ReactivateResult = { status: "reactivated"; emailId: string } | ReactivateRefusal | ManageFailure;

export type InvitationState = { status: "valid"; name: string } | { status: "expired" | "invalid" };

export type ActivationResult = { status: "activated" | "expired" | "invalid" };

export interface ManagedRow {
  id: string;
  role: string;
  standId: string | null;
  kofDesk: number | null;
  name: string;
  email: string;
  status: string;
}

export type Lookup = { kind: "found"; account: ManagedRow } | { kind: "refused"; failure: ManageFailure };

type StandChoice =
  { kind: "chosen"; standId: string | null } | { kind: "refused"; status: "forbidden" | "invalidStand" };

const ENTITY_TYPE = "account";

/**
 * Creates the account as `invited`, its invitation and the email with the activation link in one transaction (RF-40,
 * S1 to S4). Who may invite which role is decided by `canManageRole`.
 */
export async function inviteAccount(actor: ManagingActor, rawInput: InviteInput, now: Date): Promise<InviteResult> {
  // The accounts table only accepts a trimmed lower-case email, so it is normalized here and not only by the parser.
  const input = { ...rawInput, email: rawInput.email.trim().toLowerCase() };

  if (!canManageRole(actor.role, input.role)) return { status: "forbidden" };

  if (!hasValidDesk(input)) return { status: "invalidDesk" };

  const stand = await chooseStand(actor, input);

  if (stand.kind === "refused") return { status: stand.status };

  const { standId } = stand;
  const refusal = await findInviteRefusal({ input, standId });

  return refusal ?? createAccountWithInvitation({ actor, input, standId, now });
}

export interface NewInvitedAccount {
  name: string;
  email: string;
  role: string;
  kofDesk: KofDesk | null;
  standId: string | null;
  createdById: string;
  now: Date;
}

/** A new link for an account that has not been activated; the previous link stops working (S5). */
export async function resendInvitation(actor: ManagingActor, accountId: string, now: Date): Promise<ResendResult> {
  const lookup = await findManagedAccount(actor, accountId);

  if (lookup.kind === "refused") return lookup.failure;

  const { account } = lookup;

  if (account.status !== "invited") return { status: "wrongState" };

  return getPrisma().$transaction(async (transaction): Promise<ResendResult> => {
    const token = await issueInvitation(transaction, account.id, now);
    const emailId = await enqueueEmail(transaction, buildInvitationEmail(account.email, account.name, token));

    await recordAudit(transaction, auditOf(actor, "account.resend_invitation", account.id));

    return { status: "sent", emailId };
  });
}

/** Disables an account, which frees its desk and closes its sessions at once (S5). */
export async function disableAccount(actor: ManagingActor, accountId: string): Promise<DisableResult> {
  const lookup = await findManagedAccount(actor, accountId);

  if (lookup.kind === "refused") return lookup.failure;

  if (lookup.account.status === "disabled") return { status: "wrongState" };

  const { account } = lookup;
  const protection = await findDisableProtection(actor, account);

  if (protection) return protection;

  try {
    return await getPrisma().$transaction((transaction) => markDisabled({ transaction, actor, account }));
  } catch (cause) {
    return explainDisableFailure(cause);
  }
}

async function markDisabled(request: {
  transaction: Prisma.TransactionClient;
  actor: ManagingActor;
  account: ManagedRow;
}): Promise<DisableResult> {
  const { transaction, actor, account } = request;

  await transaction.account.update({ where: { id: account.id }, data: { status: "disabled" } });
  await transaction.session.deleteMany({ where: { accountId: account.id } });
  await recordAudit(transaction, auditOf(actor, "account.disable", account.id));

  return { status: "disabled" };
}

// Two sysadmins can pass the check together; the trigger of the table stops the second one and rolls its changes back.
function explainDisableFailure(cause: unknown): DisableRefusal {
  if (readDatabaseMessage(cause).includes("last_sysadmin")) return { status: "lastSysadmin" };

  throw cause;
}

/**
 * Gives a disabled account its place back. The minimum that is safe: it returns to `invited` with a new link of 72
 * hours, so the person chooses a password again (the old one is erased) and nobody gets in with credentials from before
 * the account was disabled. It follows the same limits as a new invitation: 3 staff per stand, one staff per KOF desk
 * and one administrator per stand (the triggers of the table are the safety net if two requests race).
 */
export async function reactivateAccount(actor: ManagingActor, accountId: string, now: Date): Promise<ReactivateResult> {
  const lookup = await findManagedAccount(actor, accountId);

  if (lookup.kind === "refused") return lookup.failure;

  const { account } = lookup;

  if (account.status !== "disabled") return { status: "wrongState" };

  const refusal = await findReactivateRefusal(account);

  if (refusal) return refusal;

  try {
    return await getPrisma().$transaction((transaction) => restoreAsInvited({ transaction, actor, account, now }));
  } catch (cause) {
    return explainReactivateFailure(cause);
  }
}

/** Sets the password, activates the account and uses the invitation up; only one of two simultaneous calls wins. */
export async function activateAccount(token: string, password: string, now: Date): Promise<ActivationResult> {
  const state = await getInvitationState(token, now);

  if (state.status !== "valid") return { status: state.status };

  const passwordHash = await hashPassword(password);

  return getPrisma().$transaction(async (transaction): Promise<ActivationResult> => {
    const invitation = await transaction.accountInvitation.findUnique({
      where: { token: hashToken(token) },
      select: { id: true, accountId: true },
    });

    const used = invitation
      ? await transaction.accountInvitation.updateMany({
          where: { id: invitation.id, usedAt: null },
          data: { usedAt: now },
        })
      : { count: 0 };

    if (!invitation || used.count === 0) return { status: "invalid" };

    await transaction.account.update({
      where: { id: invitation.accountId },
      data: { status: "active", password: passwordHash },
    });
    await recordAudit(transaction, {
      actorId: invitation.accountId,
      action: "account.activate",
      entityType: ENTITY_TYPE,
      entityId: invitation.accountId,
      detail: {},
    });

    return { status: "activated" };
  });
}

/** What the activation page can say about a link; an unknown or used link is `invalid` (S6). */
export async function getInvitationState(token: string, now: Date): Promise<InvitationState> {
  const invitation = await getPrisma().accountInvitation.findUnique({
    where: { token: hashToken(token) },
    select: { usedAt: true, expiresAt: true, account: { select: { name: true, status: true } } },
  });

  if (!invitation || invitation.usedAt || invitation.account.status !== "invited") return { status: "invalid" };

  if (isInvitationExpired(invitation.expiresAt, now)) return { status: "expired" };

  return { status: "valid", name: invitation.account.name };
}

/** The accounts the role manages, by role and name, whatever their status (S8). */
export async function listManagedAccounts(actorRole: string): Promise<ManagedAccount[]> {
  const roles = getManagedRoles(actorRole);

  if (roles.length === 0) return [];

  const rows = await getPrisma().account.findMany({
    where: { role: { in: [...roles] } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, status: true, kofDesk: true },
  });

  return rows.map((row) => ({ ...row, status: toStatus(row.status), kofDesk: toKofDesk(row.kofDesk) }));
}

/** The accounts of one role at the stands, whatever their status; with `standId` only those of that stand (RF-32, RF-38). */
export async function listStandAccounts(filter: {
  role: "stand_admin" | "stand_staff";
  standId?: string;
}): Promise<StandAccountRow[]> {
  const rows = await getPrisma().account.findMany({
    where: { role: filter.role, standId: filter.standId ?? { not: null } },
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, email: true, role: true, status: true, kofDesk: true, standId: true },
  });

  return rows.flatMap(({ standId, ...row }) =>
    standId ? [{ ...row, standId, status: toStatus(row.status), kofDesk: toKofDesk(row.kofDesk) }] : [],
  );
}

async function restoreAsInvited(request: {
  transaction: Prisma.TransactionClient;
  actor: ManagingActor;
  account: ManagedRow;
  now: Date;
}): Promise<ReactivateResult> {
  const { transaction, actor, account, now } = request;

  await transaction.account.update({ where: { id: account.id }, data: { status: "invited", password: null } });

  const token = await issueInvitation(transaction, account.id, now);
  const emailId = await enqueueEmail(transaction, buildInvitationEmail(account.email, account.name, token));

  await recordAudit(transaction, auditOf(actor, "account.reactivate", account.id));

  return { status: "reactivated", emailId };
}

async function findReactivateRefusal(account: ManagedRow): Promise<ReactivateRefusal | null> {
  const { role, standId, kofDesk } = account;

  if (role === "stand_staff" && standId && (await countStandStaff(standId)) >= MAX_STAND_STAFF) {
    return { status: "standFull" };
  }

  if (role === "stand_admin" && standId && (await hasStandAdmin(standId))) return { status: "adminTaken" };

  return role === "kof_staff" && (kofDesk === 1 || kofDesk === 2) && (await isDeskTaken(kofDesk))
    ? { status: "deskTaken" }
    : null;
}

async function findDisableProtection(actor: ManagingActor, account: ManagedRow): Promise<DisableRefusal | null> {
  if (account.role !== "sysadmin") return null;

  if (account.id === actor.id) return { status: "selfProtected" };

  return account.status === "active" && !(await hasOtherActiveSysadmin(account.id)) ? { status: "lastSysadmin" } : null;
}

async function hasOtherActiveSysadmin(accountId: string): Promise<boolean> {
  const other = await getPrisma().account.findFirst({
    where: { role: "sysadmin", status: "active", id: { not: accountId } },
    select: { id: true },
  });

  return other !== null;
}

async function hasStandAdmin(standId: string): Promise<boolean> {
  const admin = await getPrisma().account.findFirst({
    where: { role: "stand_admin", standId, status: { not: "disabled" } },
    select: { id: true },
  });

  return admin !== null;
}

function explainReactivateFailure(cause: unknown): ReactivateRefusal {
  const message = readDatabaseMessage(cause);

  if (message.includes("La mesa ya tiene un staff")) return { status: "deskTaken" };

  if (message.includes("3 cuentas de staff")) return { status: "standFull" };

  if (message.includes("ya tiene un administrador")) return { status: "adminTaken" };

  throw cause;
}

// The stand of a stand administrator's staff is its own, never one that the form names (RF-32). The sysadmin names it,
// and only the stand roles have one.
async function chooseStand(actor: ManagingActor, input: InviteInput): Promise<StandChoice> {
  if (actor.role !== "sysadmin") {
    const standId = input.role === "stand_staff" ? (actor.standId ?? null) : null;

    return input.role === "stand_staff" && !standId
      ? { kind: "refused", status: "forbidden" }
      : { kind: "chosen", standId };
  }

  const standId = input.standId ?? null;
  const isStandRole = input.role === "stand_admin" || input.role === "stand_staff";
  const isValid = isStandRole === (standId !== null) && (standId === null || (await standExists(standId)));

  return isValid ? { kind: "chosen", standId } : { kind: "refused", status: "invalidStand" };
}

async function standExists(standId: string): Promise<boolean> {
  return (await getPrisma().stand.findUnique({ where: { id: standId }, select: { id: true } })) !== null;
}

// A KOF staff member needs a desk and nobody else has one.
function hasValidDesk(input: InviteInput): boolean {
  return (input.role === "kof_staff") === (input.kofDesk !== null);
}

async function findInviteRefusal({
  input,
  standId,
}: {
  input: InviteInput;
  standId: string | null;
}): Promise<InviteRefusal | null> {
  const emailRefusal = await findEmailRefusal(input.email);

  if (emailRefusal) return emailRefusal;

  if (input.role === "stand_admin" && standId && (await hasStandAdmin(standId))) return { status: "adminTaken" };

  if (input.role === "stand_staff" && standId && (await countStandStaff(standId)) >= MAX_STAND_STAFF) {
    return { status: "standFull" };
  }

  return input.kofDesk !== null && (await isDeskTaken(input.kofDesk)) ? { status: "deskTaken" } : null;
}

/** The checks on an email that every new account passes; `null` when it can be used. */
export async function findEmailRefusal(email: string): Promise<InviteRefusal | null> {
  if (await getPrisma().account.findUnique({ where: { email }, select: { id: true } })) {
    return { status: "emailTaken" };
  }

  // RN-02: whoever has a passport cannot be staff or administrator. The column of visitors ignores the case.
  if (await getPrisma().visitor.findFirst({ where: { email }, select: { id: true } })) {
    return { status: "hasPassport" };
  }

  return null;
}

async function createAccountWithInvitation(invite: {
  actor: ManagingActor;
  input: InviteInput;
  standId: string | null;
  now: Date;
}): Promise<InviteResult> {
  const { actor, input, standId, now } = invite;

  try {
    return await getPrisma().$transaction(async (transaction): Promise<InviteResult> => {
      const { accountId, emailId } = await createInvitedAccount(transaction, {
        ...input,
        standId,
        createdById: actor.id,
        now,
      });

      const detail = { role: input.role, kofDesk: input.kofDesk, standId };

      await recordAudit(transaction, { ...auditOf(actor, "account.invite", accountId), detail });

      return { status: "invited", accountId, emailId };
    });
  } catch (cause) {
    return explainInviteFailure(cause);
  }
}

/** The account as `invited`, its invitation and the email with the activation link, inside the transaction of the caller. */
export async function createInvitedAccount(
  transaction: Prisma.TransactionClient,
  account: NewInvitedAccount,
): Promise<{ accountId: string; emailId: string }> {
  const created = await transaction.account.create({
    data: {
      email: account.email,
      name: account.name,
      role: account.role,
      status: "invited",
      kofDesk: account.kofDesk,
      standId: account.standId,
      createdById: account.createdById,
      createdAt: account.now,
    },
    select: { id: true },
  });

  const token = await issueInvitation(transaction, created.id, account.now);
  const emailId = await enqueueEmail(transaction, buildInvitationEmail(account.email, account.name, token));

  return { accountId: created.id, emailId };
}

// Two requests can pass the checks together; the unique email and the trigger of the desk stop the second one.
function explainInviteFailure(cause: unknown): InviteRefusal {
  if (isUniqueViolation(cause)) return { status: "emailTaken" };

  if (readDatabaseMessage(cause).includes("La mesa ya tiene un staff")) return { status: "deskTaken" };

  if (readDatabaseMessage(cause).includes("3 cuentas de staff")) return { status: "standFull" };

  if (readDatabaseMessage(cause).includes("ya tiene un administrador")) return { status: "adminTaken" };

  throw cause;
}

// Invited and active staff count against the limit; a disabled account frees its place.
async function countStandStaff(standId: string): Promise<number> {
  return getPrisma().account.count({ where: { role: "stand_staff", standId, status: { not: "disabled" } } });
}

async function isDeskTaken(kofDesk: KofDesk): Promise<boolean> {
  const taken = await getPrisma().account.findFirst({
    where: { role: "kof_staff", kofDesk, status: { not: "disabled" } },
    select: { id: true },
  });

  return taken !== null;
}

/** The account when the actor may act on it; otherwise the failure to answer. */
export async function findManagedAccount(actor: ManagingActor, accountId: string): Promise<Lookup> {
  const account = await getPrisma().account.findUnique({
    where: { id: accountId },
    select: { id: true, role: true, name: true, email: true, status: true, standId: true, kofDesk: true },
  });

  if (!account) return { kind: "refused", failure: { status: "notFound" } };

  if (!canManageAccount({ actor, target: account })) return { kind: "refused", failure: { status: "forbidden" } };

  return { kind: "found", account };
}

// The audit detail never carries the email address or the token.
export function auditOf(actor: ManagingActor, action: string, accountId: string) {
  return { actorId: actor.id, action, entityType: ENTITY_TYPE, entityId: accountId, detail: {} };
}

export function toStatus(value: string): AccountStatus {
  if (value === "active" || value === "disabled") return value;

  return "invited";
}

export function toKofDesk(value: number | null): KofDesk | null {
  return value === 1 || value === 2 ? value : null;
}

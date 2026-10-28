import "server-only";
import type { InviteInput } from "@features/accounts/lib/invitation-input";
import { canManageRole, getManagedRoles, isInvitationExpired } from "@features/accounts/lib/invitation-rules";
import { buildInvitationEmail, issueInvitation } from "@features/accounts/lib/server/invitation-tokens";
import type { AccountStatus, KofDesk, ManagedAccount } from "@features/accounts/lib/types";
import { recordAudit } from "@shared/lib/server/audit-log";
import { isUniqueViolation, readDatabaseMessage } from "@shared/lib/server/database-errors";
import { enqueueEmail } from "@shared/lib/server/email-outbox";
import { hashPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";
import { hashToken } from "@shared/lib/server/token-hash";

export interface ManagingActor {
  id: string;
  role: string;
}

type InviteRefusal = { status: "emailTaken" | "hasPassport" | "deskTaken" };

export type InviteResult =
  { status: "invited"; accountId: string; emailId: string } | { status: "forbidden" | "invalidDesk" } | InviteRefusal;

export type ManageFailure = { status: "forbidden" | "notFound" | "wrongState" };

export type ResendResult = { status: "sent"; emailId: string } | ManageFailure;

export type DisableResult = { status: "disabled" } | ManageFailure;

export type InvitationState = { status: "valid"; name: string } | { status: "expired" | "invalid" };

export type ActivationResult = { status: "activated" | "expired" | "invalid" };

interface ManagedRow {
  id: string;
  role: string;
  name: string;
  email: string;
  status: string;
}

type Lookup = { kind: "found"; account: ManagedRow } | { kind: "refused"; failure: ManageFailure };

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

  const refusal = await findInviteRefusal(input);

  return refusal ?? createAccountWithInvitation(actor, input, now);
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

  return getPrisma().$transaction(async (transaction): Promise<DisableResult> => {
    await transaction.account.update({ where: { id: account.id }, data: { status: "disabled" } });
    await transaction.session.deleteMany({ where: { accountId: account.id } });
    await recordAudit(transaction, auditOf(actor, "account.disable", account.id));

    return { status: "disabled" };
  });
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

// A KOF staff member needs a desk and nobody else has one.
function hasValidDesk(input: InviteInput): boolean {
  return (input.role === "kof_staff") === (input.kofDesk !== null);
}

async function findInviteRefusal(input: InviteInput): Promise<InviteRefusal | null> {
  if (await getPrisma().account.findUnique({ where: { email: input.email }, select: { id: true } })) {
    return { status: "emailTaken" };
  }

  // RN-02: whoever has a passport cannot be staff or administrator. The column of visitors ignores the case.
  if (await getPrisma().visitor.findFirst({ where: { email: input.email }, select: { id: true } })) {
    return { status: "hasPassport" };
  }

  return input.kofDesk !== null && (await isDeskTaken(input.kofDesk)) ? { status: "deskTaken" } : null;
}

async function createAccountWithInvitation(actor: ManagingActor, input: InviteInput, now: Date): Promise<InviteResult> {
  try {
    return await getPrisma().$transaction(async (transaction): Promise<InviteResult> => {
      const account = await transaction.account.create({
        data: {
          email: input.email,
          name: input.name,
          role: input.role,
          status: "invited",
          kofDesk: input.kofDesk,
          createdById: actor.id,
        },
        select: { id: true },
      });

      const token = await issueInvitation(transaction, account.id, now);
      const emailId = await enqueueEmail(transaction, buildInvitationEmail(input.email, input.name, token));
      const detail = { role: input.role, kofDesk: input.kofDesk };

      await recordAudit(transaction, { ...auditOf(actor, "account.invite", account.id), detail });

      return { status: "invited", accountId: account.id, emailId };
    });
  } catch (cause) {
    return explainInviteFailure(cause);
  }
}

// Two requests can pass the checks together; the unique email and the trigger of the desk stop the second one.
function explainInviteFailure(cause: unknown): InviteRefusal {
  if (isUniqueViolation(cause)) return { status: "emailTaken" };

  if (readDatabaseMessage(cause).includes("La mesa ya tiene un staff")) return { status: "deskTaken" };

  throw cause;
}

async function isDeskTaken(kofDesk: KofDesk): Promise<boolean> {
  const taken = await getPrisma().account.findFirst({
    where: { role: "kof_staff", kofDesk, status: { not: "disabled" } },
    select: { id: true },
  });

  return taken !== null;
}

async function findManagedAccount(actor: ManagingActor, accountId: string): Promise<Lookup> {
  const account = await getPrisma().account.findUnique({
    where: { id: accountId },
    select: { id: true, role: true, name: true, email: true, status: true },
  });

  if (!account) return { kind: "refused", failure: { status: "notFound" } };

  if (!canManageRole(actor.role, account.role)) return { kind: "refused", failure: { status: "forbidden" } };

  return { kind: "found", account };
}

// The audit detail never carries the email address or the token.
function auditOf(actor: ManagingActor, action: string, accountId: string) {
  return { actorId: actor.id, action, entityType: ENTITY_TYPE, entityId: accountId, detail: {} };
}

function toStatus(value: string): AccountStatus {
  if (value === "active" || value === "disabled") return value;

  return "invited";
}

function toKofDesk(value: number | null): KofDesk | null {
  return value === 1 || value === 2 ? value : null;
}

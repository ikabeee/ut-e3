import { ACCOUNT_ROLES, type AccountRole } from "@features/accounts/lib/types";

/** An invitation works for 72 hours after it is sent. */
export const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

export const MIN_PASSWORD_LENGTH = 12;

export type PasswordProblem = "tooShort" | "mismatch";

const SYSADMIN_ROLE = "sysadmin";

const SYSADMIN_MANAGES: readonly AccountRole[] = ["kof_admin", "raffle_admin", "help_desk"];

const KOF_ADMIN_MANAGES: readonly AccountRole[] = ["kof_staff"];

const STAND_ADMIN_MANAGES: readonly AccountRole[] = ["stand_staff"];

/** A stand has at most this many staff accounts that are invited or active (RF-32). */
export const MAX_STAND_STAFF = 3;

export interface ManageActor {
  role: string;
  /** The second role of a stand administrator (S1); it adds what that role may manage. */
  secondaryRole?: string | null;
  /** Only the account of a stand has one. */
  standId?: string | null;
}

export interface ManageTarget {
  role: string;
  standId: string | null;
}

/**
 * Whether the actor may act on that account: the sysadmin on every role, the stand administrator only on the staff of
 * its own stand (RF-32) and the KOF administrator only on the KOF staff. An actor with a secondary role may do what
 * either of its two roles may, each with its own limits: the stand scope belongs to the stand role.
 */
export function canManageAccount({ actor, target }: { actor: ManageActor; target: ManageTarget }): boolean {
  return getActorRoles(actor).some((role) => canManageWithRole({ role, standId: actor.standId }, target));
}

function canManageWithRole(actor: { role: string; standId?: string | null }, target: ManageTarget): boolean {
  if (!canManageRole(actor.role, target.role)) return false;

  return actor.role !== "stand_admin" || (Boolean(actor.standId) && actor.standId === target.standId);
}

/** Whether the actor may invite that role: the sysadmin every role, the others the roles of `getManagedRoles`. */
export function canManageRole(actorRole: string, targetRole: string, secondaryRole?: string | null): boolean {
  if (isSysadminActor({ role: actorRole, secondaryRole })) return ACCOUNT_ROLES.some((role) => role === targetRole);

  return getManagedRoles(actorRole, secondaryRole).some((role) => role === targetRole);
}

/**
 * The roles the panel of the home of the sysadmin lists and invites (the administrators), and the staff each manager
 * invites, with those of the secondary role after them. The sysadmin can act on every role, but only /admin/accounts
 * offers them all.
 */
export function getManagedRoles(actorRole: string, secondaryRole?: string | null): readonly AccountRole[] {
  const roles = [...getManagedRolesOf(actorRole), ...(secondaryRole ? getManagedRolesOf(secondaryRole) : [])];

  return roles.filter((role, index) => roles.indexOf(role) === index);
}

/** Whether the sysadmin is one of the roles of the actor, as the primary one or the secondary one (S2). */
export function isSysadminActor(actor: Pick<ManageActor, "role" | "secondaryRole">): boolean {
  return getActorRoles(actor).includes(SYSADMIN_ROLE);
}

function getActorRoles({ role, secondaryRole }: Pick<ManageActor, "role" | "secondaryRole">): string[] {
  return secondaryRole ? [role, secondaryRole] : [role];
}

function getManagedRolesOf(role: string): readonly AccountRole[] {
  switch (role) {
    case "sysadmin":
      return SYSADMIN_MANAGES;
    case "kof_admin":
      return KOF_ADMIN_MANAGES;
    case "stand_admin":
      return STAND_ADMIN_MANAGES;
    default:
      return [];
  }
}

export function isInvitationExpired(expiresAt: Date, now: Date): boolean {
  return now >= expiresAt;
}

/** `null` when the password can be used. The password is taken as typed, without trimming it. */
export function validateNewPassword(password: string, confirmation: string): PasswordProblem | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "tooShort";

  return password === confirmation ? null : "mismatch";
}

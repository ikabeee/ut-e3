import type { AccountRole } from "@features/accounts/lib/types";

/** An invitation works for 72 hours after it is sent. */
export const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

export const MIN_PASSWORD_LENGTH = 12;

export type PasswordProblem = "tooShort" | "mismatch";

const SYSADMIN_MANAGES: readonly AccountRole[] = ["kof_admin", "raffle_admin", "help_desk"];

const KOF_ADMIN_MANAGES: readonly AccountRole[] = ["kof_staff"];

const STAND_ADMIN_MANAGES: readonly AccountRole[] = ["stand_staff"];

/** A stand has at most this many staff accounts that are invited or active (RF-32). */
export const MAX_STAND_STAFF = 3;

export interface ManageActor {
  role: string;
  /** Only the account of a stand has one. */
  standId?: string | null;
}

export interface ManageTarget {
  role: string;
  standId: string | null;
}

/**
 * Whether the actor may resend or disable that account: the roles it manages, and the stand administrator only the staff
 * of its own stand (RF-32). The sysadmin also manages the stand administrators, whom it creates with the stand (RF-39).
 */
export function canManageAccount({ actor, target }: { actor: ManageActor; target: ManageTarget }): boolean {
  if (actor.role === "sysadmin" && target.role === "stand_admin") return true;

  if (!canManageRole(actor.role, target.role)) return false;

  return actor.role !== "stand_admin" || (Boolean(actor.standId) && actor.standId === target.standId);
}

export function canManageRole(actorRole: string, targetRole: string): boolean {
  return getManagedRoles(actorRole).some((role) => role === targetRole);
}

/** The roles an account can invite, disable and re-invite: the sysadmin the administrators, the KOF and stand administrators their staff. */
export function getManagedRoles(actorRole: string): readonly AccountRole[] {
  switch (actorRole) {
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

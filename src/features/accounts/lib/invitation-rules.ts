import type { AccountRole } from "@features/accounts/lib/types";

/** An invitation works for 72 hours after it is sent. */
export const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

export const MIN_PASSWORD_LENGTH = 12;

export type PasswordProblem = "tooShort" | "mismatch";

const SYSADMIN_MANAGES: readonly AccountRole[] = ["kof_admin", "raffle_admin", "help_desk"];

const KOF_ADMIN_MANAGES: readonly AccountRole[] = ["kof_staff"];

export function canManageRole(actorRole: string, targetRole: string): boolean {
  return getManagedRoles(actorRole).some((role) => role === targetRole);
}

/** The roles an account can invite, disable and re-invite: the sysadmin the administrators, the KOF administrator its staff. */
export function getManagedRoles(actorRole: string): readonly AccountRole[] {
  switch (actorRole) {
    case "sysadmin":
      return SYSADMIN_MANAGES;
    case "kof_admin":
      return KOF_ADMIN_MANAGES;
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

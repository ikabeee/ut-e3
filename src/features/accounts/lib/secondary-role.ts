import { SECONDARY_ROLES, type SecondaryRole } from "@features/accounts/lib/types";

/** The value that the form of /admin/accounts sends to take the secondary role away. */
export const NO_SECONDARY_ROLE = "none";

export type SecondaryRoleChoice = { isValid: true; role: SecondaryRole | null } | { isValid: false };

/** What the form chose: one of the secondary roles, `none` to remove it, and anything else is not valid. */
export function parseSecondaryRole(value: string): SecondaryRoleChoice {
  if (value === NO_SECONDARY_ROLE) return { isValid: true, role: null };

  return isSecondaryRole(value) ? { isValid: true, role: value } : { isValid: false };
}

export function isSecondaryRole(value: string): value is SecondaryRole {
  return SECONDARY_ROLES.some((role) => role === value);
}

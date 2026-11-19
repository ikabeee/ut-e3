import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { getHomePath, STAND_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { isSecondaryRole } from "@features/accounts/lib/secondary-role";

export interface AreaLink {
  href: string;
  label: string;
}

/**
 * The link of an account with two roles to its other area (S1): from the area of its primary role (the stand) to the
 * one of its secondary role, and from there back. Null for an account with one role.
 */
export function getOtherAreaLink(roles: readonly string[], from: "primary" | "secondary"): AreaLink | null {
  const secondary = roles[1];

  if (!secondary || !isSecondaryRole(secondary)) return null;

  if (from === "secondary") return { href: STAND_HOME_PATH, label: ACCOUNTS_COPY.areas.toStand };

  return { href: getHomePath(secondary), label: ACCOUNTS_COPY.areas.toRole[secondary] };
}

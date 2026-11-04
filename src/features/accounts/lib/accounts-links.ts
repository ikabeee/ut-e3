export const LOGIN_PATH = "/login";

export const SYSADMIN_HOME_PATH = "/admin";

// The activation link of an invitation is `${ACTIVATE_PATH}/<token>`.
export const ACTIVATE_PATH = "/activate";

// The KOF accounts sign in here instead of /admin; the page itself belongs to the tournament feature.
export const KOF_HOME_PATH = "/admin/kof";

// The stand accounts sign in to the kiosk of their stand; the page itself belongs to the stands feature.
export const STAND_HOME_PATH = "/stand/kiosk";

// The raffle administrators sign in to the panel of the raffle; the page itself belongs to the raffle feature.
export const RAFFLE_HOME_PATH = "/admin/raffle";

// The help desk signs in to the recovery desk; the page itself belongs to the support feature.
export const SUPPORT_HOME_PATH = "/support/recovery";

export function getHomePath(role: string): string {
  if (role === "kof_admin" || role === "kof_staff") return KOF_HOME_PATH;

  if (role === "stand_admin" || role === "stand_staff") return STAND_HOME_PATH;

  if (role === "raffle_admin") return RAFFLE_HOME_PATH;

  return role === "help_desk" ? SUPPORT_HOME_PATH : SYSADMIN_HOME_PATH;
}

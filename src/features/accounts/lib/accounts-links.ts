export const LOGIN_PATH = "/login";

export const SYSADMIN_HOME_PATH = "/admin";

// The activation link of an invitation is `${ACTIVATE_PATH}/<token>`.
export const ACTIVATE_PATH = "/activate";

// The KOF accounts sign in here instead of /admin; the page itself belongs to the tournament feature.
export const KOF_HOME_PATH = "/admin/kof";

export function getHomePath(role: string): string {
  return role === "kof_admin" || role === "kof_staff" ? KOF_HOME_PATH : SYSADMIN_HOME_PATH;
}

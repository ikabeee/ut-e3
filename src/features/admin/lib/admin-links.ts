import { SYSADMIN_HOME_PATH } from "@features/accounts/lib/accounts-links";

export const ADMIN_SETTINGS_PATH = `${SYSADMIN_HOME_PATH}/settings`;

export const ADMIN_MODERATION_PATH = `${SYSADMIN_HOME_PATH}/moderation`;

export const ADMIN_CATALOG_PATH = `${SYSADMIN_HOME_PATH}/catalog`;

export const ADMIN_SERVER_PATH = `${SYSADMIN_HOME_PATH}/server`;

export const ADMIN_SQL_PATH = `${SYSADMIN_HOME_PATH}/sql`;

export const ADMIN_LOGS_PATH = `${SYSADMIN_HOME_PATH}/logs`;

/** A link to the logs page: `values` are the filters of the tab; the ones that are empty stay out of the address. */
export function buildLogsHref(tab: "audit" | "server", values: Record<string, string>, page: number = 1): string {
  const query = new URLSearchParams({ tab });

  for (const [name, value] of Object.entries(values)) if (value) query.set(name, value);

  if (page > 1) query.set("page", String(page));

  return `${ADMIN_LOGS_PATH}?${query.toString()}`;
}

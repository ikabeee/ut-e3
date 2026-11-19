import { SYSADMIN_HOME_PATH } from "@features/accounts/lib/accounts-links";

export const ADMIN_SETTINGS_PATH = `${SYSADMIN_HOME_PATH}/settings`;

export const ADMIN_MODERATION_PATH = `${SYSADMIN_HOME_PATH}/moderation`;

export const ADMIN_CATALOG_PATH = `${SYSADMIN_HOME_PATH}/catalog`;

export const ADMIN_SERVER_PATH = `${SYSADMIN_HOME_PATH}/server`;

export const ADMIN_ACCOUNTS_PATH = `${SYSADMIN_HOME_PATH}/accounts`;

export const ADMIN_EMAILS_PATH = `${SYSADMIN_HOME_PATH}/emails`;

export const ADMIN_SQL_PATH = `${SYSADMIN_HOME_PATH}/sql`;

export const ADMIN_RECOVERY_PATH = `${SYSADMIN_HOME_PATH}/recovery`;

/** The Route Handler that streams the backup of the database (sysadmin only). */
export const ADMIN_BACKUP_PATH = "/api/admin/recovery/backup";

export const ADMIN_VISITORS_PATH = `${SYSADMIN_HOME_PATH}/visitors`;

import { KOF_HOME_PATH, RAFFLE_HOME_PATH, SYSADMIN_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import {
  ADMIN_ACCOUNTS_PATH,
  ADMIN_CATALOG_PATH,
  ADMIN_EMAILS_PATH,
  ADMIN_LOGS_PATH,
  ADMIN_MODERATION_PATH,
  ADMIN_RECOVERY_PATH,
  ADMIN_SERVER_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_SQL_PATH,
  ADMIN_VISITORS_PATH,
} from "@features/admin/lib/admin-links";

/** The icon of each section; `admin-nav-icons.tsx` draws one for every name. */
export type AdminNavIconName =
  | "home"
  | "settings"
  | "moderation"
  | "visitors"
  | "catalog"
  | "server"
  | "accounts"
  | "emails"
  | "sql"
  | "logs"
  | "recovery"
  | "kof"
  | "raffle";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: AdminNavIconName;
}

const COPY = ADMIN_COPY.nav;

/** The sections of the panel of the sysadmin (M7), in the order of the sidebar: the single source of the navigation. */
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { href: SYSADMIN_HOME_PATH, label: COPY.home, icon: "home" },
  { href: ADMIN_SETTINGS_PATH, label: COPY.settings, icon: "settings" },
  { href: ADMIN_MODERATION_PATH, label: COPY.moderation, icon: "moderation" },
  { href: ADMIN_VISITORS_PATH, label: COPY.visitors, icon: "visitors" },
  { href: ADMIN_CATALOG_PATH, label: COPY.catalog, icon: "catalog" },
  { href: ADMIN_SERVER_PATH, label: COPY.server, icon: "server" },
  { href: ADMIN_ACCOUNTS_PATH, label: COPY.accounts, icon: "accounts" },
  { href: ADMIN_EMAILS_PATH, label: COPY.emails, icon: "emails" },
  { href: ADMIN_SQL_PATH, label: COPY.sql, icon: "sql" },
  { href: ADMIN_LOGS_PATH, label: COPY.logs, icon: "logs" },
  { href: ADMIN_RECOVERY_PATH, label: COPY.recovery, icon: "recovery" },
  { href: KOF_HOME_PATH, label: COPY.kof, icon: "kof" },
  { href: RAFFLE_HOME_PATH, label: COPY.raffle, icon: "raffle" },
];

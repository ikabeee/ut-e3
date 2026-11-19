import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import {
  KOF_HOME_PATH,
  RAFFLE_HOME_PATH,
  STAND_HOME_PATH,
  SUPPORT_HOME_PATH,
  SYSADMIN_HOME_PATH,
} from "@features/accounts/lib/accounts-links";
import { ACCOUNT_ROLES, type AccountRole, type KofDesk } from "@features/accounts/lib/types";

const COPY = ACCOUNTS_COPY.myRole;

export interface MyRoleStand {
  /** The full code of the stand, such as `ZA-S1-E6-101`; the page builds it with `formatAdminStandCode`. */
  code: string;
  gameName: string | null;
  /** The active administrator of the stand; null when it has none. */
  adminName: string | null;
}

/** The pages of other features that a role uses; the page passes them, so `accounts` does not import those features. */
export interface MyRolePaths {
  standGame: string;
  standTeam: string;
}

export interface MyRoleContext {
  stand: MyRoleStand | null;
  kofDesk: KofDesk | null;
  paths: MyRolePaths;
}

export interface MyRoleScreen {
  href: string;
  label: string;
}

/** What the page explains of one role of the account (S4). The hours of the event are not here: the page brings them. */
export interface MyRoleCard {
  role: AccountRole;
  title: string;
  summary: string;
  steps: readonly string[];
  screens: MyRoleScreen[];
  /** The stand, the desk or the area of the role; null for a stand role whose account has no stand. */
  placement: string | null;
  contact: string;
}

type ScreenKey = keyof typeof COPY.screens;

const ROLE_SCREENS: Record<AccountRole, readonly ScreenKey[]> = {
  sysadmin: ["panel", "kof", "raffle", "recovery"],
  stand_admin: ["kiosk", "game", "team"],
  stand_staff: ["kiosk"],
  kof_admin: ["kof"],
  kof_staff: ["kof"],
  raffle_admin: ["raffle"],
  help_desk: ["recovery"],
};

/** One card for each role of the account, in the order of `roles` (the primary first). What is not a role of the app is left out. */
export function buildMyRoleCards(roles: readonly string[], context: MyRoleContext): MyRoleCard[] {
  const appRoles = new Set(roles.filter(isAccountRole));

  return [...appRoles].map((role) => buildCard(role, context));
}

function isAccountRole(value: string): value is AccountRole {
  return ACCOUNT_ROLES.some((role) => role === value);
}

function buildCard(role: AccountRole, context: MyRoleContext): MyRoleCard {
  const { summary, steps } = COPY.roles[role];

  return {
    role,
    title: ACCOUNTS_COPY.management.panel.roles[role],
    summary,
    steps,
    screens: ROLE_SCREENS[role].map((key) => ({ href: getScreenPath(key, context.paths), label: COPY.screens[key] })),
    placement: getPlacement(role, context),
    contact: getContact(role, context.stand),
  };
}

function getScreenPath(key: ScreenKey, paths: MyRolePaths): string {
  const screenPaths: Record<ScreenKey, string> = {
    panel: SYSADMIN_HOME_PATH,
    kiosk: STAND_HOME_PATH,
    game: paths.standGame,
    team: paths.standTeam,
    kof: KOF_HOME_PATH,
    raffle: RAFFLE_HOME_PATH,
    recovery: SUPPORT_HOME_PATH,
  };

  return screenPaths[key];
}

function getPlacement(role: AccountRole, { stand, kofDesk }: MyRoleContext): string | null {
  if (role === "stand_admin" || role === "stand_staff") {
    return stand ? COPY.placement.stand(stand.code, stand.gameName) : null;
  }

  if (role === "kof_staff") {
    return kofDesk === null ? COPY.placement.deskPending : COPY.placement.desk(kofDesk);
  }

  return COPY.placement.areas[role];
}

// The staff of a stand asks its administrator; everyone else asks the sysadmin, who is the one asked about everything.
function getContact(role: AccountRole, stand: MyRoleStand | null): string {
  if (role === "stand_staff" && stand?.adminName) return COPY.contact.standAdmin(stand.adminName);

  return role === "sysadmin" ? COPY.contact.self : COPY.contact.sysadmin;
}

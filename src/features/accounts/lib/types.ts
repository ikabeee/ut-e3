export const ACCOUNT_ROLES = [
  "sysadmin",
  "stand_admin",
  "stand_staff",
  "raffle_admin",
  "kof_admin",
  "kof_staff",
  "help_desk",
] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];

/** The two staff desks of the KOF tournament; each one captures a pair of boards (RF-62). */
export type KofDesk = 1 | 2;

export type AccountStatus = "invited" | "active" | "disabled";

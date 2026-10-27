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

export type AccountStatus = "invited" | "active" | "disabled";

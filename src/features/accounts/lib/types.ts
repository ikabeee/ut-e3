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

/** An account as the panels of the sysadmin and of the KOF administrator list it. */
export interface ManagedAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  status: AccountStatus;
  kofDesk: KofDesk | null;
}

/** An account as the list of /admin/accounts shows it: any role, with its stand, creation date and last sign-in. */
export interface AdminAccountRow extends ManagedAccount {
  standId: string | null;
  /** Null for the accounts created before the column existed and for rows inserted by hand. */
  createdAt: Date | null;
  /** The last verified sign-in; null when the account never signed in. */
  lastLoginAt: Date | null;
}

/** A stand account in a list of the sysadmin or of the stand administrator. */
export interface StandAccountRow extends ManagedAccount {
  standId: string;
}

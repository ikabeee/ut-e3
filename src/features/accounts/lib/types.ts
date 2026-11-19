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

/** The roles that a stand administrator can have besides its own (S1, S2); the CHECK of the accounts table lists them too. */
export const SECONDARY_ROLES = ["help_desk", "kof_admin", "raffle_admin", "sysadmin"] as const;

export type SecondaryRole = (typeof SECONDARY_ROLES)[number];

/** The four staff desks of the KOF tournament; desk n captures board n (RF-62, S3). */
export const KOF_DESKS = [1, 2, 3, 4] as const;

export type KofDesk = (typeof KOF_DESKS)[number];

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
  /** The second role of a stand administrator; null for everyone else and for a leader who has none. */
  secondaryRole: string | null;
  /** Null for the accounts created before the column existed and for rows inserted by hand. */
  createdAt: Date | null;
  /** The last verified sign-in; null when the account never signed in. */
  lastLoginAt: Date | null;
}

/** A stand account in a list of the sysadmin or of the stand administrator. */
export interface StandAccountRow extends ManagedAccount {
  standId: string;
}

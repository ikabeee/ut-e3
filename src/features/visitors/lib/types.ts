export interface Passport {
  gamertag: string;
  pin: string;
}

export interface PassportStand {
  code: string;
  visited: boolean;
  /** The game of the stand; `null` while the stand has no game yet (the grid shows only the code). */
  gameName: string | null;
}

export interface PassportTicket {
  number: number;
  milestone: number;
  /** The sysadmin annulled a visit and the visitor fell below the milestone (RF-46); absent while it is active. */
  voided?: boolean;
}

export interface PassportVisits {
  visitCount: number;
  stands: PassportStand[];
  tickets: PassportTicket[];
}

export interface BlockedEmail {
  email: string;
  createdAt: string;
  /** A visitor already registered with it: the list does not touch the passport, the sysadmin excludes it (RF-46). */
  hasPassport: boolean;
}

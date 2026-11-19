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

export type VisitorSort = "newest" | "oldest";

export interface VisitorListParams {
  query: string;
  /** 1-based. */
  page: number;
  sort: VisitorSort;
}

/** One registration for the sysadmin. It never carries the PIN, its hash or its ciphertext. */
export interface AdminVisitorRow {
  id: string;
  gamertag: string;
  fullName: string;
  email: string;
  createdAt: string;
  /** Visits the sysadmin did not annul. */
  visitCount: number;
  /** Tickets that still enter the raffle. */
  activeTickets: number;
  /** registered, checked_in or no_show; null without an entry to the KOF. */
  tournamentStatus: string | null;
  isExcluded: boolean;
}

export interface AdminVisitorPage {
  rows: AdminVisitorRow[];
  total: number;
  page: number;
  pageCount: number;
}

export interface DailyRegistrations {
  /** `YYYY-MM-DD` in Cancun. */
  day: string;
  count: number;
}

/** Before `raffleStartsAt` nobody spins; after the administrator closes it, nobody spins again (RF-54). */
export type RafflePhase = "upcoming" | "open" | "closed";

/** A drawn ticket waits for "Ganador" or "Descartado" (RF-51); the decision is final. */
export type DrawOutcome = "pending" | "winner" | "discarded";

/** The last ticket that came out, as the drum on stage shows it (RF-49). Dates travel as ISO 8601 text. */
export interface LiveDraw {
  id: string;
  ticketNumber: number;
  gamertag: string;
  outcome: DrawOutcome;
  drawnAt: string;
}

/** A confirmed winner of the public section (RF-56): no name or email, only the gamertag. */
export interface RaffleWinner {
  drawId: string;
  ticketNumber: number;
  gamertag: string;
  /** When "Ganador" was confirmed. */
  decidedAt: string;
  /** `null` until a raffle administrator registers the prize handed over (RF-55). */
  prizeName: string | null;
}

/** What the public screens read: `/raffle/live` and the section of winners. */
export interface RaffleLiveSnapshot {
  phase: RafflePhase;
  startsAt: string;
  latest: LiveDraw | null;
  winners: RaffleWinner[];
  /** Changes with every spin, decision and prize, so an older answer that arrives late is ignored. */
  revision: number;
  serverNow: number;
}

/** The draw that blocks the next spin until somebody decides it (RF-51). */
export interface PendingDraw {
  id: string;
  ticketNumber: number;
  gamertag: string;
  drawnAt: string;
  drawnById: string;
  drawnByName: string;
}

export interface AdminWinner extends RaffleWinner {
  /** The raffle administrator that registered the prize. */
  prizeByName: string | null;
}

/** What the panel of the raffle administrators reads. */
export interface RaffleAdminSnapshot {
  phase: RafflePhase;
  startsAt: string;
  closedAt: string | null;
  activeTickets: number;
  pending: PendingDraw | null;
  winners: AdminWinner[];
  discardedCount: number;
  revision: number;
  serverNow: number;
}

/** What the passport of a winner shows (RF-25). */
export interface RaffleWin {
  ticketNumber: number;
  decidedAt: string;
  prizeName: string | null;
}

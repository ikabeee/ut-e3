export type BoardNumber = 1 | 2 | 3 | 4;

/** Each of the two staff desks captures a pair of boards (RF-62). */
export type Desk = 1 | 2;

export type MatchArea = "board_1" | "board_2" | "board_3" | "board_4" | "semifinal_1" | "semifinal_2" | "final";

/** RF-66: `frozen` is only set by the KOF administrator. */
export type MatchStatus = "pending" | "ready" | "active" | "finished" | "frozen";

/** Slot 0 is the first player of the match and slot 1 the second. */
export type SlotIndex = 0 | 1;

export type SlotSource = { kind: "seed" } | { kind: "winner"; matchId: string };

export interface MatchSlot {
  source: SlotSource;
  /** `null` with `resolved: true` is a bye: nobody arrives through this slot. */
  playerId: string | null;
  resolved: boolean;
}

/** `bye` and `empty` settle on their own; the rest come from a person (RF-61, RF-63, RF-64). */
export type MatchOutcome = "played" | "no_show" | "disqualified" | "bye" | "empty";

export interface Match {
  id: string;
  /** 1 to 63; boards go first, then the semifinals and the final. */
  number: number;
  area: MatchArea;
  /** 1 to 4 on a board, 5 in the semifinals and 6 in the final. */
  round: number;
  slots: [MatchSlot, MatchSlot];
  status: MatchStatus;
  statusBeforeFreeze: "ready" | "active" | null;
  /** `null` while it is open, and also when both players were removed. */
  winnerSlot: SlotIndex | null;
  outcome: MatchOutcome | null;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface Player {
  id: string;
  tag: string;
}

export type TournamentPhase = "running" | "finished";

export interface TournamentLogEntry {
  at: number;
  message: string;
}

/** The whole state is plain JSON so it can be stored in one row and cloned safely. */
export interface Tournament {
  phase: TournamentPhase;
  /** The players that checked in, in the order the shuffle left them. */
  players: Player[];
  matches: Match[];
  /** `null` while the final is open, and also when it ended without a champion. */
  championId: string | null;
  /** Newest first. */
  log: TournamentLogEntry[];
  /** Raised by every command; the server uses it to detect a stale copy. */
  version: number;
}

/** Commands are serializable objects, so Server Actions and the stored log share one shape. */
export type TournamentCommand =
  | { type: "start_match"; matchId: string }
  | { type: "finish_match"; matchId: string; loserSlot: SlotIndex }
  | { type: "mark_no_show"; matchId: string; slots: SlotIndex[] }
  | { type: "freeze_match"; matchId: string }
  | { type: "unfreeze_match"; matchId: string }
  | { type: "disqualify"; matchId: string; slots: SlotIndex[] }
  | { type: "revert_result"; matchId: string };

export type TournamentCommandType = TournamentCommand["type"];

/** pre: the list that the KOF administrator builds; onsite: the sign-up at the KOF area on the event day. */
export type EntryChannel = "pre" | "onsite";

export type EntryStatus = "registered" | "checked_in" | "no_show";

export interface EntryView {
  id: string;
  visitorId: string;
  gamertag: string;
  channel: EntryChannel;
  status: EntryStatus;
  /** ISO instant, only when the status is `checked_in`. */
  checkedInAt: string | null;
}

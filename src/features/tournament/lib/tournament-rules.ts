import type { BoardNumber, Desk, Match, TournamentCommandType } from "@features/tournament/lib/types";

export const BOARD_NUMBERS: readonly BoardNumber[] = [1, 2, 3, 4];

/** 16 players and 15 matches per board (RF-57). */
export const PLAYERS_PER_BOARD = 16;

export const MATCHES_PER_BOARD = 15;

export const MAX_ENTRANTS = BOARD_NUMBERS.length * PLAYERS_PER_BOARD;

/** Below this a first round match would be a bye against a bye, which RF-60 forbids. */
export const MIN_ENTRANTS = MAX_ENTRANTS / 2;

/** Freezing, disqualifying and reverting belong to the KOF administrator (RF-63, RF-64). */
export const ADMIN_ONLY_COMMANDS: readonly TournamentCommandType[] = [
  "freeze_match",
  "unfreeze_match",
  "disqualify",
  "revert_result",
];

export interface KofActor {
  role: "kof_admin" | "kof_staff";
  /** The desk of a staff member; the administrator has none and captures everything. */
  desk: Desk | null;
}

/** The administrator runs any command; a staff member captures only the matches of its own desk (RF-62). */
export function canRunCommand(actor: KofActor, type: TournamentCommandType, match: Pick<Match, "area">): boolean {
  if (actor.role === "kof_admin") return true;

  if (ADMIN_ONLY_COMMANDS.includes(type)) return false;

  return actor.desk !== null && actor.desk === getMatchDesk(match);
}

/** Desk 1: boards 1 and 2, semifinal 1 and the final. Desk 2: boards 3 and 4 and semifinal 2 (RF-62). */
export function getMatchDesk(match: Pick<Match, "area">): Desk {
  switch (match.area) {
    case "board_1":
    case "board_2":
    case "semifinal_1":
    case "final":
      return 1;
    default:
      return 2;
  }
}

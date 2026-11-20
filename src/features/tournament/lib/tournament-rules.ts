import type { BoardNumber, Desk, Match, MatchArea, TournamentCommandType } from "@features/tournament/lib/types";

export const BOARD_NUMBERS: readonly BoardNumber[] = [1, 2, 3, 4];

/** In bracket order: the four boards, then the semifinals and the final. */
export const MATCH_AREAS: readonly MatchArea[] = [
  "board_1",
  "board_2",
  "board_3",
  "board_4",
  "semifinal_1",
  "semifinal_2",
  "final",
];

/** 16 players and 15 matches per board (RF-57). */
export const PLAYERS_PER_BOARD = 16;

export const MATCHES_PER_BOARD = 15;

/** What the administrator types to reset the tournament; the button alone is too easy to press by mistake. */
export const RESET_CONFIRMATION = "REINICIAR";

export const MAX_ENTRANTS = BOARD_NUMBERS.length * PLAYERS_PER_BOARD;

/** The pre-registration list leaves at least 14 of the 64 places for the event day (RF-58). */
export const PRE_LIST_LIMIT = 50;

/**
 * Fewer than 8 would leave a board without players. From 32 down some first round matches have nobody in them: they
 * settle as "empty" and the next round gets a bye, so a player only ever waits for the next real opponent.
 */
export const MIN_ENTRANTS = 8;

/** Freezing, disqualifying and reverting belong to the KOF administrator (RF-63, RF-64). */
export const ADMIN_ONLY_COMMANDS: readonly TournamentCommandType[] = [
  "freeze_match",
  "unfreeze_match",
  "disqualify",
  "revert_result",
];

export interface KofActor {
  /** The sysadmin only watches /admin/kof: it has no desk, so it runs no command (S37). */
  role: "kof_admin" | "kof_staff" | "sysadmin";
  /** The desk of a staff member; the administrator has none and captures everything. */
  desk: Desk | null;
}

/**
 * The administrator runs any command; a staff member captures only the matches of its own desk (RF-62). A match
 * without a desk (a semifinal or the final) is only for the administrator.
 */
export function canRunCommand(actor: KofActor, type: TournamentCommandType, match: Pick<Match, "area">): boolean {
  if (actor.role === "kof_admin") return true;

  if (ADMIN_ONLY_COMMANDS.includes(type)) return false;

  const desk = getMatchDesk(match);

  return desk !== null && actor.desk === desk;
}

/** Who sees the list of participants (S26): the sysadmin and the KOF administrator; the desks only see the bracket. */
const ENTRIES_VIEWER_ROLES: readonly string[] = ["sysadmin", "kof_admin"];

export function canViewEntries(role: string): boolean {
  return ENTRIES_VIEWER_ROLES.includes(role);
}

/** Desk n captures board n. The semifinals and the final have no desk: only the KOF administrator captures them (S3). */
export function getMatchDesk(match: Pick<Match, "area">): Desk | null {
  switch (match.area) {
    case "board_1":
      return 1;
    case "board_2":
      return 2;
    case "board_3":
      return 3;
    case "board_4":
      return 4;
    default:
      return null;
  }
}

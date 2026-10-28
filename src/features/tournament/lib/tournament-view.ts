import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { getMatchDesk, MATCH_AREAS } from "@features/tournament/lib/tournament-rules";
import type { Desk, Match, MatchArea, MatchStatus, SlotIndex, Tournament } from "@features/tournament/lib/types";

export interface ViewScope {
  isAdmin: boolean;
  desk: Desk | null;
}

export interface MatchSection {
  area: MatchArea;
  matches: Match[];
}

export interface PlayerView {
  slot: SlotIndex;
  tag: string;
  isBye: boolean;
  isWinner: boolean;
}

export interface StatusCounts {
  ready: number;
  active: number;
  frozen: number;
  finished: number;
}

// What the person can act on comes first; the bracket order is kept inside each group.
const CAPTURE_PRIORITY: Record<MatchStatus, number> = { active: 0, ready: 1, frozen: 2, pending: 3, finished: 4 };

/** The administrator sees every area; a staff member only the areas of its desk (RF-61). */
export function getSections(tournament: Tournament, scope: ViewScope): MatchSection[] {
  return MATCH_AREAS.filter(
    (area) => scope.isAdmin || (scope.desk !== null && getMatchDesk({ area }) === scope.desk),
  ).map((area) => ({ area, matches: tournament.matches.filter((match) => match.area === area) }));
}

export function sortForCapture(matches: readonly Match[]): Match[] {
  return matches.toSorted(
    (first, second) => CAPTURE_PRIORITY[first.status] - CAPTURE_PRIORITY[second.status] || first.number - second.number,
  );
}

export function getMatchPlayers(tournament: Tournament, match: Match): [PlayerView, PlayerView] {
  return [toPlayerView(tournament, match, 0), toPlayerView(tournament, match, 1)];
}

export function getChampionTag(tournament: Tournament): string | null {
  if (tournament.phase !== "finished" || tournament.championId === null) return null;

  return getTag(tournament, tournament.championId, true);
}

export function getStatusCounts(matches: readonly Match[]): StatusCounts {
  return {
    ready: countStatus(matches, "ready"),
    active: countStatus(matches, "active"),
    frozen: countStatus(matches, "frozen"),
    finished: countStatus(matches, "finished"),
  };
}

function toPlayerView(tournament: Tournament, match: Match, slot: SlotIndex): PlayerView {
  const { playerId, resolved } = match.slots[slot];

  return {
    slot,
    tag: getTag(tournament, playerId, resolved),
    isBye: resolved && playerId === null,
    isWinner: match.status === "finished" && match.winnerSlot === slot,
  };
}

function getTag(tournament: Tournament, playerId: string | null, resolved: boolean): string {
  if (!resolved) return TOURNAMENT_COPY.tbd;

  if (playerId === null) return TOURNAMENT_COPY.bye;

  return tournament.players.find((player) => player.id === playerId)?.tag ?? TOURNAMENT_COPY.tbd;
}

function countStatus(matches: readonly Match[], status: MatchStatus): number {
  return matches.filter((match) => match.status === status).length;
}

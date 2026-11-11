import { buildBracket } from "@features/tournament/lib/bracket-layout";
import { addLog, settleMatch } from "@features/tournament/lib/match-resolution";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { TournamentRuleError } from "@features/tournament/lib/tournament-rule-error";
import {
  BOARD_NUMBERS,
  MAX_ENTRANTS,
  MIN_ENTRANTS,
  PLAYERS_PER_BOARD,
} from "@features/tournament/lib/tournament-rules";
import type { BoardNumber, Match, Player, SlotIndex, Tournament } from "@features/tournament/lib/types";

/** Uniform integer in `[0, maxExclusive)`; production passes `crypto.randomInt` (RF-59). */
export type RandomInt = (maxExclusive: number) => number;

/**
 * Builds the bracket once, with the players that checked in: Fisher-Yates shuffle, empty places as byes spread over the
 * four boards (RF-59, RF-60).
 */
export function generateBracket(entrants: readonly Player[], randomInt: RandomInt, now: number): Tournament {
  requireEntrantCount(entrants.length);

  const players = shuffle(entrants, randomInt);

  const tournament: Tournament = {
    phase: "running",
    players,
    matches: buildBracket(),
    championId: null,
    log: [],
    version: 0,
  };

  addLog(tournament, now, TOURNAMENT_COPY.log.bracketGenerated(players.length, MAX_ENTRANTS - players.length));
  placePlayers(tournament.matches, players);
  tournament.matches.filter((match) => match.round === 1).forEach((match) => settleMatch(tournament, match, now));

  return tournament;
}

export function shuffle<T>(items: readonly T[], randomInt: RandomInt): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomInt(index + 1);

    [result[index], result[other]] = [result[other], result[index]];
  }

  return result;
}

function requireEntrantCount(count: number) {
  if (count < MIN_ENTRANTS || count > MAX_ENTRANTS) {
    throw new TournamentRuleError(TOURNAMENT_COPY.errors.invalidEntrantCount(MIN_ENTRANTS, MAX_ENTRANTS));
  }
}

function placePlayers(matches: readonly Match[], players: readonly Player[]) {
  const boardPlayers = splitIntoBoards(players, getByeCounts(MAX_ENTRANTS - players.length));

  BOARD_NUMBERS.forEach((board, index) => fillBoard(getFirstRound(matches, board), boardPlayers[index]));
}

// The empty places are dealt one by one to the boards, so no board has more than one bye over another.
function getByeCounts(byes: number): number[] {
  return BOARD_NUMBERS.map((_, index) => Math.floor(byes / BOARD_NUMBERS.length) + (index < byes % 4 ? 1 : 0));
}

function splitIntoBoards(players: readonly Player[], byeCounts: readonly number[]): Player[][] {
  let start = 0;

  return byeCounts.map((byes) => {
    const end = start + PLAYERS_PER_BOARD - byes;
    const group = players.slice(start, end);

    start = end;

    return group;
  });
}

function getFirstRound(matches: readonly Match[], board: BoardNumber): Match[] {
  return matches.filter((match) => match.area === `board_${board}` && match.round === 1);
}

function fillBoard(firstRound: readonly Match[], boardPlayers: readonly Player[]) {
  const byeMatches = getByeMatchIndexes(firstRound.length, PLAYERS_PER_BOARD - boardPlayers.length);
  let next = 0;

  firstRound.forEach((match, index) => {
    const count = byeMatches.has(index) ? 1 : 2;

    assignPlayers(match, boardPlayers.slice(next, next + count), index % 2 === 0 ? 0 : 1);
    next += count;
  });
}

// Spaced out over the round: a bye never shares a match with another bye (RF-60).
function getByeMatchIndexes(matchCount: number, byes: number): Set<number> {
  return new Set(Array.from({ length: byes }, (_, index) => Math.floor((index * matchCount) / byes)));
}

function assignPlayers(match: Match, group: readonly Player[], byeSlot: SlotIndex) {
  if (group.length === 2) {
    setSlotPlayer(match, 0, group[0].id);
    setSlotPlayer(match, 1, group[1].id);

    return;
  }

  setSlotPlayer(match, byeSlot === 0 ? 1 : 0, group[0].id);
  setSlotPlayer(match, byeSlot, null);
}

function setSlotPlayer(match: Match, slot: SlotIndex, playerId: string | null) {
  match.slots[slot].playerId = playerId;
  match.slots[slot].resolved = true;
}

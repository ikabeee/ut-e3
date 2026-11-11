import type { PublicBracket, PublicMatch } from "@features/tournament/lib/public-bracket";
import { MATCHES_PER_BOARD } from "@features/tournament/lib/tournament-rules";
import type { SlotIndex } from "@features/tournament/lib/types";

export interface AdvanceTarget {
  number: number;
  slot: SlotIndex;
}

/** A match that a person decided since the last answer, and where its winner goes (S8). */
export interface ResultChange {
  number: number;
  /** `null` when both players were removed: there is nobody to move on. */
  winnerSlot: SlotIndex | null;
  /** `null` for the final and for a match without a winner. */
  advance: AdvanceTarget | null;
}

// First match number of each round inside a board of 15: rounds of 8, 4, 2 and 1.
const ROUND_STARTS = [0, 8, 12, 14];

const FIRST_SEMIFINAL = 61;

const FINAL = 63;

/** The matches that a person decided between two answers, in bracket order. Byes that settle on their own are not changes. */
export function diffResults(previous: PublicBracket, next: PublicBracket): ResultChange[] {
  const wasFinished = new Set(previous.matches.filter(isFinished).map((match) => match.number));

  return next.matches
    .filter((match) => isDecidedByPerson(match) && !wasFinished.has(match.number))
    .map(toChange)
    .toSorted((first, second) => first.number - second.number);
}

/** Shows the result of the match; the next round keeps what it showed until the winner arrives. */
export function applyDecision(displayed: PublicBracket, target: PublicBracket, number: number): PublicBracket {
  const decided = target.matches.find((match) => match.number === number);

  if (!decided) return displayed;

  return { ...displayed, matches: displayed.matches.map((match) => (match.number === number ? decided : match)) };
}

/** Puts the winner in its slot of the next round, and only that slot: another result may not have been shown yet. */
export function applyAdvance(displayed: PublicBracket, target: PublicBracket, change: ResultChange): PublicBracket {
  const { advance } = change;

  if (!advance || change.winnerSlot === null) return displayed;

  const arrived = target.matches.find((match) => match.number === advance.number)?.players[advance.slot];

  if (!arrived) return displayed;

  return { ...displayed, matches: displayed.matches.map((match) => placePlayer(match, advance, arrived)) };
}

function placePlayer(match: PublicMatch, advance: AdvanceTarget, arrived: PublicMatch["players"][number]): PublicMatch {
  if (match.number !== advance.number) return match;

  const [first, second] = match.players;

  return { ...match, players: advance.slot === 0 ? [arrived, second] : [first, arrived] };
}

function isFinished(match: PublicMatch): boolean {
  return match.status === "finished";
}

function isDecidedByPerson(match: PublicMatch): boolean {
  return (
    isFinished(match) && (match.outcome === "played" || match.outcome === "no_show" || match.outcome === "disqualified")
  );
}

function toChange(match: PublicMatch): ResultChange {
  const winnerSlot = getWinnerSlot(match);

  return { number: match.number, winnerSlot, advance: winnerSlot === null ? null : getAdvanceTarget(match.number) };
}

function getWinnerSlot(match: PublicMatch): SlotIndex | null {
  if (match.players[0].isWinner) return 0;

  return match.players[1].isWinner ? 1 : null;
}

/** Where the winner of a match is placed next. Positional, like the tree; the tests check it against the engine. */
export function getAdvanceTarget(number: number): AdvanceTarget | null {
  if (number >= FINAL) return null;

  if (number >= FIRST_SEMIFINAL) return { number: FINAL, slot: number === FIRST_SEMIFINAL ? 0 : 1 };

  const board = Math.floor((number - 1) / MATCHES_PER_BOARD);
  const position = (number - 1) % MATCHES_PER_BOARD;
  const round = ROUND_STARTS.findLastIndex((start) => position >= start);

  if (round === ROUND_STARTS.length - 1) {
    return { number: FIRST_SEMIFINAL + Math.floor(board / 2), slot: board % 2 === 0 ? 0 : 1 };
  }

  const index = position - ROUND_STARTS[round];

  return {
    number: board * MATCHES_PER_BOARD + ROUND_STARTS[round + 1] + Math.floor(index / 2) + 1,
    slot: index % 2 === 0 ? 0 : 1,
  };
}

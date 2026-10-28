import { BOARD_NUMBERS, MATCHES_PER_BOARD } from "@features/tournament/lib/tournament-rules";
import type { BoardNumber, Match, MatchArea, MatchSlot } from "@features/tournament/lib/types";

/** Matches per round on a board of 16 players. */
const ROUND_SIZES = [8, 4, 2, 1];

const SEMIFINAL_ROUND = ROUND_SIZES.length + 1;

const FINAL_ROUND = ROUND_SIZES.length + 2;

/** The 63 matches of the single elimination bracket: 4 boards of 15, 2 semifinals and the final (RF-57). */
export function buildBracket(): Match[] {
  const boards = BOARD_NUMBERS.flatMap((board) => buildBoard(board));

  const firstSemifinal = feedFrom(
    createMatch(boards.length + 1, "semifinal_1", SEMIFINAL_ROUND),
    getBoardFinal(boards, 1),
    getBoardFinal(boards, 2),
  );

  const secondSemifinal = feedFrom(
    createMatch(boards.length + 2, "semifinal_2", SEMIFINAL_ROUND),
    getBoardFinal(boards, 3),
    getBoardFinal(boards, 4),
  );

  const final = feedFrom(createMatch(boards.length + 3, "final", FINAL_ROUND), firstSemifinal, secondSemifinal);

  return [...boards, firstSemifinal, secondSemifinal, final];
}

/** The match that receives the winner of this one, or `null` for the final. */
export function findNextMatch(matches: readonly Match[], matchId: string): Match | null {
  const next = matches.find((match) =>
    match.slots.some((slot) => slot.source.kind === "winner" && slot.source.matchId === matchId),
  );

  return next ?? null;
}

function buildBoard(board: BoardNumber): Match[] {
  const area: MatchArea = `board_${board}`;
  const firstNumber = (board - 1) * MATCHES_PER_BOARD + 1;
  const matches: Match[] = [];
  let previousRound: Match[] = [];

  ROUND_SIZES.forEach((size, roundIndex) => {
    const created = Array.from({ length: size }, (_, index) =>
      createMatch(firstNumber + matches.length + index, area, roundIndex + 1),
    );

    const round = connectToPreviousRound(created, previousRound);

    matches.push(...round);
    previousRound = round;
  });

  return matches;
}

// The first round has no feeders: its slots are filled with the shuffled players.
function connectToPreviousRound(round: Match[], previousRound: readonly Match[]): Match[] {
  if (previousRound.length === 0) return round;

  return round.map((match, index) => feedFrom(match, previousRound[index * 2], previousRound[index * 2 + 1]));
}

function getBoardFinal(boards: readonly Match[], board: BoardNumber): Match {
  return boards[board * MATCHES_PER_BOARD - 1];
}

function createMatch(number: number, area: MatchArea, round: number): Match {
  return {
    id: `match-${number}`,
    number,
    area,
    round,
    slots: [createSeedSlot(), createSeedSlot()],
    status: "pending",
    statusBeforeFreeze: null,
    winnerSlot: null,
    outcome: null,
    startedAt: null,
    finishedAt: null,
  };
}

function feedFrom(match: Match, first: Match, second: Match): Match {
  return { ...match, slots: [createWinnerSlot(first), createWinnerSlot(second)] };
}

function createSeedSlot(): MatchSlot {
  return { source: { kind: "seed" }, playerId: null, resolved: false };
}

function createWinnerSlot(feeder: Match): MatchSlot {
  return { source: { kind: "winner", matchId: feeder.id }, playerId: null, resolved: false };
}

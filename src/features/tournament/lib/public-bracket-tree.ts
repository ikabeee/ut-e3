import type { PublicBracket, PublicMatch } from "@features/tournament/lib/public-bracket";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { MatchArea } from "@features/tournament/lib/types";

export interface TreeColumn {
  label: string;
  /** From top to bottom; the two matches `2i` and `2i + 1` of a column feed the match `i` of the next one. */
  matches: PublicMatch[];
}

/** The bracket as two mirrored halves, outer round first, with the final in the middle. */
export interface BracketTree {
  left: TreeColumn[];
  right: TreeColumn[];
  final: PublicMatch;
  finalLabel: string;
}

const COPY = TOURNAMENT_COPY.ui.publicBracket.tree;

const BOARD_ROUNDS = [1, 2, 3, 4];

/**
 * Boards 1 and 2 meet in semifinal 1 on the left, boards 3 and 4 in semifinal 2 on the right (RF-57). The layout is
 * positional: in each round the matches are numbered in the order they appear, and a match is fed by the two that sit
 * next to each other in the column before it. The tests check that against the slots of the stored tournament.
 */
export function buildBracketTree(bracket: PublicBracket): BracketTree {
  return {
    left: buildHalf(bracket, ["board_1", "board_2"], "semifinal_1"),
    right: buildHalf(bracket, ["board_3", "board_4"], "semifinal_2"),
    final: findFinal(bracket),
    finalLabel: COPY.final,
  };
}

function buildHalf(bracket: PublicBracket, boards: readonly MatchArea[], semifinal: MatchArea): TreeColumn[] {
  const rounds = BOARD_ROUNDS.map((round, index) => ({
    label: COPY.rounds[index],
    matches: boards.flatMap((area) => matchesOf(bracket, area, round)),
  }));

  return [
    ...rounds,
    { label: COPY.rounds[BOARD_ROUNDS.length], matches: bracket.matches.filter((match) => match.area === semifinal) },
  ];
}

function matchesOf(bracket: PublicBracket, area: MatchArea, round: number): PublicMatch[] {
  return bracket.matches.filter((match) => match.area === area && match.round === round);
}

function findFinal(bracket: PublicBracket): PublicMatch {
  const final = bracket.matches.find((match) => match.area === "final");

  if (!final) throw new Error("The public bracket has no final");

  return final;
}

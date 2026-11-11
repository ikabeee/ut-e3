import { buildBracketTree } from "@features/tournament/lib/public-bracket-tree";
import { toPublicBracket } from "@features/tournament/lib/public-bracket";
import { createTestTournament } from "@features/tournament/__tests__/tournament-test-utils";

function numbers(column: { matches: { number: number }[] }): number[] {
  return column.matches.map((match) => match.number);
}

describe("buildBracketTree (S7)", () => {
  const tournament = createTestTournament();
  const tree = buildBracketTree(toPublicBracket(tournament));

  it("builds two halves of five columns with 16, 8, 4, 2 and 1 matches, and the final in the middle", () => {
    expect(tree.left.map((column) => column.matches.length)).toEqual([16, 8, 4, 2, 1]);
    expect(tree.right.map((column) => column.matches.length)).toEqual([16, 8, 4, 2, 1]);
    expect(tree.final.number).toBe(63);
  });

  it("puts boards 1 and 2 on the left and boards 3 and 4 on the right, top to bottom", () => {
    expect(numbers(tree.left[0])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 16, 17, 18, 19, 20, 21, 22, 23]);
    expect(numbers(tree.right[0])).toEqual([31, 32, 33, 34, 35, 36, 37, 38, 46, 47, 48, 49, 50, 51, 52, 53]);
    expect(numbers(tree.left[3])).toEqual([15, 30]);
    expect(numbers(tree.right[3])).toEqual([45, 60]);
    expect(numbers(tree.left[4])).toEqual([61]);
    expect(numbers(tree.right[4])).toEqual([62]);
  });

  it("names the rounds from the outside in", () => {
    const labels = ["Ronda 1", "Ronda 2", "Ronda 3", "Final de tablero", "Semifinal"];

    expect(tree.left.map((column) => column.label)).toEqual(labels);
    expect(tree.right.map((column) => column.label)).toEqual(labels);
    expect(tree.finalLabel).toBe("Final");
  });

  it("places every match right in front of the two matches that feed it, which the layout depends on", () => {
    const feeders = (number: number): number[] =>
      tournament.matches
        .find((match) => match.number === number)
        ?.slots.map((slot) => {
          const source = slot.source;

          return source.kind === "winner"
            ? (tournament.matches.find((match) => match.id === source.matchId)?.number ?? -1)
            : -1;
        }) ?? [];

    [tree.left, tree.right].forEach((half) => {
      half.slice(1).forEach((column, columnIndex) => {
        const previous = half[columnIndex];

        column.matches.forEach((match, index) => {
          expect(feeders(match.number)).toEqual([
            previous.matches[index * 2].number,
            previous.matches[index * 2 + 1].number,
          ]);
        });
      });
    });

    expect(feeders(tree.final.number)).toEqual([tree.left[4].matches[0].number, tree.right[4].matches[0].number]);
  });

  it("keeps all 63 matches and repeats none", () => {
    const all = [...tree.left, ...tree.right].flatMap(numbers).concat(tree.final.number);

    expect(new Set(all).size).toBe(63);
  });
});

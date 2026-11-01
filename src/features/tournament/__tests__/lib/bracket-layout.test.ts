import { buildBracket, findNextMatch } from "@features/tournament/lib/bracket-layout";
import { range } from "@features/tournament/__tests__/tournament-test-utils";

describe("buildBracket", () => {
  const matches = buildBracket();

  it("builds 63 matches numbered from 1 to 63", () => {
    expect(matches.map((match) => match.number)).toEqual(range(1, 63));
  });

  it("builds 15 matches per board in rounds of 8, 4, 2 and 1", () => {
    [1, 2, 3, 4].forEach((board) => {
      const boardMatches = matches.filter((match) => match.area === `board_${board}`);
      const perRound = [1, 2, 3, 4].map((round) => boardMatches.filter((match) => match.round === round).length);

      expect(boardMatches).toHaveLength(15);
      expect(perRound).toEqual([8, 4, 2, 1]);
    });
  });

  it("builds two semifinals and one final in their own areas", () => {
    expect(matches.filter((match) => match.area === "semifinal_1")).toHaveLength(1);
    expect(matches.filter((match) => match.area === "semifinal_2")).toHaveLength(1);
    expect(matches.filter((match) => match.area === "final")).toHaveLength(1);
  });

  it("points every match except the final to exactly one next match", () => {
    matches.slice(0, -1).forEach((match) => {
      const feeding = matches.filter((item) =>
        item.slots.some((slot) => slot.source.kind === "winner" && slot.source.matchId === match.id),
      );

      expect(feeding).toHaveLength(1);
      expect(findNextMatch(matches, match.id)).toBe(feeding[0]);
    });

    expect(findNextMatch(matches, matches[62].id)).toBeNull();
  });

  it("feeds the semifinals with the board winners and the final with the semifinal winners", () => {
    const sourceNumbers = (number: number) =>
      matches[number - 1].slots.map((slot) => {
        const source = slot.source;

        return source.kind === "winner" ? matches.find((item) => item.id === source.matchId)?.number : null;
      });

    expect(sourceNumbers(61)).toEqual([15, 30]);
    expect(sourceNumbers(62)).toEqual([45, 60]);
    expect(sourceNumbers(63)).toEqual([61, 62]);
  });

  it("starts every first round slot from a seed and every other slot from a winner", () => {
    matches.forEach((match) => {
      const expected = match.round === 1 ? "seed" : "winner";

      expect(match.slots.map((slot) => slot.source.kind)).toEqual([expected, expected]);
    });
  });

  it("starts every match pending with both slots unresolved", () => {
    matches.forEach((match) => {
      expect(match.status).toBe("pending");
      expect(match.slots.every((slot) => !slot.resolved && slot.playerId === null)).toBe(true);
    });
  });
});

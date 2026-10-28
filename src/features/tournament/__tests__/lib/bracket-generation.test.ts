import { generateBracket, shuffle } from "@features/tournament/lib/bracket-generation";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { TournamentRuleError } from "@features/tournament/lib/tournament-rule-error";
import type { Match } from "@features/tournament/lib/types";
import {
  createPlayers,
  createSeededRandomInt,
  createTestTournament,
  NOW,
  range,
} from "@features/tournament/__tests__/tournament-test-utils";

describe("shuffle", () => {
  it("returns a permutation of the 64 players without changing the input", () => {
    const players = createPlayers(64);
    const shuffled = shuffle(players, createSeededRandomInt(1));

    expect(shuffled).toHaveLength(64);
    expect(shuffled.map((player) => player.id).toSorted()).toEqual(players.map((player) => player.id).toSorted());
    expect(players[0].id).toBe("player-1");
  });

  it("gives the same order for the same seed and another order for another seed", () => {
    const players = createPlayers(64);
    const first = shuffle(players, createSeededRandomInt(5)).map((player) => player.id);

    expect(shuffle(players, createSeededRandomInt(5)).map((player) => player.id)).toEqual(first);
    expect(shuffle(players, createSeededRandomInt(6)).map((player) => player.id)).not.toEqual(first);
  });
});

describe("generateBracket", () => {
  it("starts a running tournament with the 64 players and 63 matches", () => {
    const tournament = createTestTournament(64);

    expect(tournament.phase).toBe("running");
    expect(tournament.players).toHaveLength(64);
    expect(tournament.matches).toHaveLength(63);
    expect(tournament.championId).toBeNull();
    expect(tournament.version).toBe(0);
  });

  it("makes the 32 first round matches ready when all 64 players are in", () => {
    const firstRound = createTestTournament(64).matches.filter((match) => match.round === 1);

    expect(firstRound).toHaveLength(32);
    expect(firstRound.every((match) => match.status === "ready")).toBe(true);
  });

  it("places every player in exactly one first round slot", () => {
    const firstRound = createTestTournament(64).matches.filter((match) => match.round === 1);
    const placed = firstRound.flatMap((match) => match.slots.map((slot) => slot.playerId));

    expect(new Set(placed).size).toBe(64);
  });

  it("gives 40 players 24 byes, 6 on each board, and no bye against a bye", () => {
    const matches = createTestTournament(40).matches;

    expect(matches.filter((match) => match.round === 1 && match.outcome === "bye")).toHaveLength(24);
    expect(matches.filter((match) => match.outcome === "empty")).toHaveLength(0);

    [1, 2, 3, 4].forEach((board) => {
      const byes = matches.filter(
        (match) => match.area === `board_${board}` && match.round === 1 && match.outcome === "bye",
      );

      expect(byes).toHaveLength(6);
    });
  });

  it("never pairs two byes and spreads the byes evenly for every size from 32 to 64", () => {
    range(32, 64).forEach((count) => {
      const matches = createTestTournament(count, count).matches;

      const perBoard = [1, 2, 3, 4].map(
        (board) => matches.filter((match) => match.area === `board_${board}` && isByeMatch(match)).length,
      );

      expect(matches.filter((match) => match.outcome === "empty")).toHaveLength(0);
      expect(perBoard.reduce((total, value) => total + value, 0)).toBe(64 - count);
      expect(Math.max(...perBoard) - Math.min(...perBoard)).toBeLessThanOrEqual(1);
    });
  });

  it("settles a bye on its own: the player advances and the match is finished", () => {
    const tournament = createTestTournament(40);
    const byeMatch = tournament.matches.find((match) => match.round === 1 && match.outcome === "bye");

    if (!byeMatch) throw new Error("Expected a bye in the first round");

    const winnerId = byeMatch.slots[byeMatch.winnerSlot ?? 0].playerId;

    const next = tournament.matches.find((match) =>
      match.slots.some((slot) => slot.source.kind === "winner" && slot.source.matchId === byeMatch.id),
    );

    expect(byeMatch.status).toBe("finished");
    expect(winnerId).not.toBeNull();
    expect(next?.slots.some((slot) => slot.playerId === winnerId)).toBe(true);
  });

  it("gives the same bracket for the same seed", () => {
    const first = generateBracket(createPlayers(50), createSeededRandomInt(9), NOW);
    const second = generateBracket(createPlayers(50), createSeededRandomInt(9), NOW);

    expect(second).toEqual(first);
  });

  it("rejects fewer than 32 or more than 64 players", () => {
    const message = TOURNAMENT_COPY.errors.invalidEntrantCount(32, 64);

    expect(() => createTestTournament(31)).toThrow(message);
    expect(() => createTestTournament(65)).toThrow(message);
    expect(() => createTestTournament(31)).toThrow(TournamentRuleError);
  });
});

function isByeMatch(match: Match) {
  return match.round === 1 && match.slots.some((slot) => slot.resolved && slot.playerId === null);
}

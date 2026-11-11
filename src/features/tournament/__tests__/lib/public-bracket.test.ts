import { toPublicBracket } from "@features/tournament/lib/public-bracket";
import {
  createTestTournament,
  freezeAndDisqualify,
  getMatch,
  playMatches,
  playUntilFinished,
  startAndFinish,
} from "@features/tournament/__tests__/tournament-test-utils";

describe("toPublicBracket (S1)", () => {
  it("lists the 63 matches with the version and the phase", () => {
    const bracket = toPublicBracket(createTestTournament());

    expect(bracket.matches).toHaveLength(63);
    expect(bracket).toMatchObject({ version: 0, phase: "running", championTag: null });
  });

  it("carries the gamertags and nothing that identifies a visitor", () => {
    const tournament = createTestTournament();
    const text = JSON.stringify(toPublicBracket(tournament));

    expect(text).toContain("Tag1");
    expect(text).not.toContain("player-");
    expect(text).not.toContain("match-");
    expect(Object.keys(toPublicBracket(tournament).matches[0]).toSorted()).toEqual([
      "area",
      "number",
      "outcome",
      "players",
      "round",
      "status",
    ]);
  });

  it("marks a bye, a place that is still open and the winner of a played match", () => {
    const base = createTestTournament(40);
    const ready = base.matches.find((match) => match.status === "ready");

    if (!ready) throw new Error("Expected a ready match");

    const matches = toPublicBracket(startAndFinish(base, ready.number, 1)).matches;
    const byeMatch = matches.find((match) => match.outcome === "bye");
    const played = matches.find((match) => match.number === ready.number);

    expect(byeMatch?.players.some((player) => player.isBye)).toBe(true);
    expect(played?.players.map((player) => player.isWinner)).toEqual([true, false]);
    expect(matches.find((match) => match.status === "pending")?.players.map((player) => player.tag)).toContain(
      "Por definir",
    );
  });

  it("names the champion when the tournament is over", () => {
    const finished = playUntilFinished(createTestTournament());
    const champion = finished.players.find((player) => player.id === finished.championId);

    expect(toPublicBracket(finished)).toMatchObject({ phase: "finished", championTag: champion?.tag });
  });

  it("has no champion when the final ended without one", () => {
    const toFinal = playMatches(
      createTestTournament(),
      Array.from({ length: 62 }, (_, index) => index + 1),
    );

    const bracket = toPublicBracket(freezeAndDisqualify(toFinal, 63, [0, 1]));

    expect(bracket).toMatchObject({ phase: "finished", championTag: null });
  });

  it("keeps the match numbers and areas of the stored tournament", () => {
    const tournament = createTestTournament();
    const first = toPublicBracket(tournament).matches[30];

    expect(first).toMatchObject({ number: 31, area: getMatch(tournament, 31).area, round: 1 });
  });
});

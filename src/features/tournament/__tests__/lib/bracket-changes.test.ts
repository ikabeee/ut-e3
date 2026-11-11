import { applyAdvance, applyDecision, diffResults, getAdvanceTarget } from "@features/tournament/lib/bracket-changes";
import { toPublicBracket } from "@features/tournament/lib/public-bracket";
import { applyCommand } from "@features/tournament/lib/tournament-engine";
import {
  createTestTournament,
  freezeAndDisqualify,
  getMatch,
  NOW,
  playMatches,
  startAndFinish,
} from "@features/tournament/__tests__/tournament-test-utils";

function bracketOf(tournament: ReturnType<typeof createTestTournament>) {
  return toPublicBracket(tournament);
}

describe("getAdvanceTarget (S8)", () => {
  it("sends the winner of every match to the slot of the next one that the engine fills", () => {
    const tournament = createTestTournament();

    tournament.matches.slice(0, -1).forEach((match) => {
      const target = getAdvanceTarget(match.number);

      const next = tournament.matches.find((item) =>
        item.slots.some((slot) => slot.source.kind === "winner" && slot.source.matchId === match.id),
      );

      const slot = next?.slots.findIndex((item) => item.source.kind === "winner" && item.source.matchId === match.id);

      expect(target).toEqual({ number: next?.number, slot });
    });
  });

  it("has no next match for the final", () => {
    expect(getAdvanceTarget(63)).toBeNull();
  });
});

describe("diffResults", () => {
  it("finds nothing when the two brackets are the same", () => {
    const bracket = bracketOf(createTestTournament());

    expect(diffResults(bracket, bracket)).toEqual([]);
  });

  it("finds a match that was decided and where its winner goes", () => {
    const before = createTestTournament();
    const after = startAndFinish(before, 1, 1);

    expect(diffResults(bracketOf(before), bracketOf(after))).toEqual([
      { number: 1, winnerSlot: 0, advance: { number: 9, slot: 0 } },
    ]);
  });

  it("finds the winner on the second slot too", () => {
    const after = startAndFinish(createTestTournament(), 2, 0);

    expect(diffResults(bracketOf(createTestTournament()), bracketOf(after))).toEqual([
      { number: 2, winnerSlot: 1, advance: { number: 9, slot: 1 } },
    ]);
  });

  it("finds several results that arrive together, in bracket order", () => {
    const before = createTestTournament();
    const after = playMatches(before, [31, 1, 16]);

    expect(diffResults(bracketOf(before), bracketOf(after)).map((change) => change.number)).toEqual([1, 16, 31]);
  });

  it("does not count a bye that settled on its own", () => {
    const before = createTestTournament(40);
    const ready = before.matches.find((match) => match.status === "ready");

    if (!ready) throw new Error("Expected a ready match");

    const after = startAndFinish(before, ready.number, 1);
    const changes = diffResults(bracketOf(before), bracketOf(after));

    expect(changes.map((change) => change.number)).toEqual([ready.number]);
  });

  it("counts a disqualification, and a double one has no winner and nowhere to go", () => {
    const before = createTestTournament();
    const single = freezeAndDisqualify(before, 1, [0]);
    const double = freezeAndDisqualify(before, 3, [0, 1]);

    expect(diffResults(bracketOf(before), bracketOf(single))).toEqual([
      { number: 1, winnerSlot: 1, advance: { number: 9, slot: 0 } },
    ]);
    expect(diffResults(bracketOf(before), bracketOf(double))).toEqual([{ number: 3, winnerSlot: null, advance: null }]);
  });

  it("ignores a match that was only started", () => {
    const before = createTestTournament();
    const started = applyCommand(before, { type: "start_match", matchId: getMatch(before, 1).id }, NOW);

    expect(diffResults(bracketOf(before), bracketOf(started))).toEqual([]);
  });

  it("gives the final no advance", () => {
    const toFinal = playMatches(
      createTestTournament(),
      Array.from({ length: 62 }, (_, index) => index + 1),
    );

    const after = startAndFinish(toFinal, 63, 1);

    expect(diffResults(bracketOf(toFinal), bracketOf(after))).toEqual([{ number: 63, winnerSlot: 0, advance: null }]);
  });
});

describe("applyDecision and applyAdvance", () => {
  const before = createTestTournament();
  const after = startAndFinish(before, 1, 1);
  const [change] = diffResults(bracketOf(before), bracketOf(after));
  const winnerTag = bracketOf(after).matches[0].players[0].tag;

  it("shows the result of the match and keeps the next round as it was", () => {
    const shown = applyDecision(bracketOf(before), bracketOf(after), 1);

    expect(shown.matches[0].status).toBe("finished");
    expect(shown.matches[0].players.map((player) => player.isWinner)).toEqual([true, false]);
    expect(getMatch(after, 9).slots[0].playerId).not.toBeNull();
    expect(shown.matches.find((match) => match.number === 9)?.players[0].tag).toBe("Por definir");
  });

  it("then puts the winner in the next round, in its slot and only there", () => {
    const decided = applyDecision(bracketOf(before), bracketOf(after), 1);
    const advanced = applyAdvance(decided, bracketOf(after), change);
    const next = advanced.matches.find((match) => match.number === 9);

    expect(next?.players.map((player) => player.tag)).toEqual([winnerTag, "Por definir"]);
  });

  it("changes nothing for a result that has no winner to move", () => {
    const decided = applyDecision(bracketOf(before), bracketOf(after), 1);

    expect(applyAdvance(decided, bracketOf(after), { number: 1, winnerSlot: null, advance: null })).toBe(decided);
  });

  it("does not change the brackets it receives", () => {
    const shown = bracketOf(before);
    const snapshot = JSON.stringify(shown);

    applyAdvance(applyDecision(shown, bracketOf(after), 1), bracketOf(after), change);

    expect(JSON.stringify(shown)).toBe(snapshot);
  });
});

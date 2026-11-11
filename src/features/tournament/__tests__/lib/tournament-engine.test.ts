import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { applyCommand } from "@features/tournament/lib/tournament-engine";
import { TournamentRuleError } from "@features/tournament/lib/tournament-rule-error";
import type { SlotIndex, Tournament } from "@features/tournament/lib/types";
import {
  createTestTournament,
  freezeAndDisqualify,
  getMatch,
  NOW,
  playMatches,
  playUntilFinished,
  range,
  startAndFinish,
} from "@features/tournament/__tests__/tournament-test-utils";

const ERRORS = TOURNAMENT_COPY.errors;

const STATUS = TOURNAMENT_COPY.status;

function run(tournament: Tournament, command: Parameters<typeof applyCommand>[1]) {
  return applyCommand(tournament, command, NOW);
}

function idOf(tournament: Tournament, number: number) {
  return getMatch(tournament, number).id;
}

function playerIn(tournament: Tournament, number: number, slot: SlotIndex) {
  return getMatch(tournament, number).slots[slot].playerId;
}

describe("start_match", () => {
  it("activates a ready match (UT-TO-11)", () => {
    const tournament = createTestTournament();
    const started = run(tournament, { type: "start_match", matchId: idOf(tournament, 1) });

    expect(getMatch(started, 1).status).toBe("active");
    expect(getMatch(started, 1).startedAt).toBe(NOW);
  });

  it("rejects a pending match that still waits for a player (UT-TO-12)", () => {
    const tournament = createTestTournament();

    expect(() => run(tournament, { type: "start_match", matchId: idOf(tournament, 9) })).toThrow(
      ERRORS.wrongStatus(STATUS.pending),
    );
  });

  it("rejects a match that does not exist", () => {
    expect(() => run(createTestTournament(), { type: "start_match", matchId: "missing" })).toThrow(
      ERRORS.matchNotFound,
    );
  });

  it("does not change the tournament it receives and raises its version", () => {
    const tournament = createTestTournament();
    const before = JSON.stringify(tournament);
    const started = run(tournament, { type: "start_match", matchId: idOf(tournament, 1) });

    expect(JSON.stringify(tournament)).toBe(before);
    expect(started.version).toBe(tournament.version + 1);
  });
});

describe("finish_match", () => {
  it("finishes the match and moves the winner to the next match (UT-TO-13)", () => {
    const tournament = createTestTournament();
    const winnerId = playerIn(tournament, 1, 0);
    const finished = startAndFinish(tournament, 1, 1);

    expect(getMatch(finished, 1)).toMatchObject({ status: "finished", winnerSlot: 0, outcome: "played" });
    expect(playerIn(finished, 9, 0)).toBe(winnerId);
    expect(getMatch(finished, 9).status).toBe("pending");
  });

  it("makes the next match ready when its second player arrives", () => {
    const played = playMatches(createTestTournament(), [1, 2]);

    expect(getMatch(played, 9).status).toBe("ready");
  });

  it("rejects a match that has not started", () => {
    const tournament = createTestTournament();

    expect(() => run(tournament, { type: "finish_match", matchId: idOf(tournament, 1), loserSlot: 1 })).toThrow(
      ERRORS.wrongStatus(STATUS.ready),
    );
  });
});

describe("mark_no_show", () => {
  it("lets the other player advance and writes it in the log (UT-TO-17)", () => {
    const tournament = createTestTournament();
    const survivorId = playerIn(tournament, 1, 0);
    const started = run(tournament, { type: "start_match", matchId: idOf(tournament, 1) });
    const result = run(started, { type: "mark_no_show", matchId: idOf(tournament, 1), slots: [1] });

    expect(getMatch(result, 1)).toMatchObject({ status: "finished", winnerSlot: 0, outcome: "no_show" });
    expect(playerIn(result, 9, 0)).toBe(survivorId);
    expect(result.log[0].message).toContain("1");
  });

  it("treats two absent players as a match without a winner", () => {
    const tournament = createTestTournament();
    const result = run(tournament, { type: "mark_no_show", matchId: idOf(tournament, 1), slots: [0, 1] });

    expect(getMatch(result, 1)).toMatchObject({ status: "finished", winnerSlot: null, outcome: "no_show" });
  });

  it("rejects an empty list of slots and a repeated slot", () => {
    const tournament = createTestTournament();
    const matchId = idOf(tournament, 1);

    expect(() => run(tournament, { type: "mark_no_show", matchId, slots: [] })).toThrow(ERRORS.invalidSlots);
    expect(() => run(tournament, { type: "mark_no_show", matchId, slots: [0, 0] })).toThrow(ERRORS.invalidSlots);
  });
});

describe("freeze_match", () => {
  it("blocks the capture of a frozen match (UT-TO-20)", () => {
    const tournament = createTestTournament();
    const matchId = idOf(tournament, 1);
    const frozen = run(run(tournament, { type: "start_match", matchId }), { type: "freeze_match", matchId });
    const message = ERRORS.wrongStatus(STATUS.frozen);

    expect(getMatch(frozen, 1).status).toBe("frozen");
    expect(() => run(frozen, { type: "finish_match", matchId, loserSlot: 1 })).toThrow(message);
    expect(() => run(frozen, { type: "start_match", matchId })).toThrow(message);
    expect(() => run(frozen, { type: "mark_no_show", matchId, slots: [1] })).toThrow(message);
  });

  it("returns the match to the status it had when it is unfrozen", () => {
    const tournament = createTestTournament();
    const matchId = idOf(tournament, 1);
    const active = run(tournament, { type: "start_match", matchId });
    const unfrozen = run(run(active, { type: "freeze_match", matchId }), { type: "unfreeze_match", matchId });

    expect(getMatch(unfrozen, 1).status).toBe("active");
    expect(
      getMatch(run(run(tournament, { type: "freeze_match", matchId }), { type: "unfreeze_match", matchId }), 1).status,
    ).toBe("ready");
  });

  it("only freezes a ready or active match", () => {
    const tournament = createTestTournament();

    expect(() => run(tournament, { type: "freeze_match", matchId: idOf(tournament, 9) })).toThrow(
      ERRORS.wrongStatus(STATUS.pending),
    );
  });
});

describe("disqualify", () => {
  it("requires a frozen match", () => {
    const tournament = createTestTournament();

    expect(() => run(tournament, { type: "disqualify", matchId: idOf(tournament, 1), slots: [1] })).toThrow(
      ERRORS.wrongStatus(STATUS.ready),
    );
  });

  it("gives the match to the other player when one is disqualified", () => {
    const tournament = createTestTournament();
    const survivorId = playerIn(tournament, 1, 1);
    const result = freezeAndDisqualify(tournament, 1, [0]);

    expect(getMatch(result, 1)).toMatchObject({ status: "finished", winnerSlot: 1, outcome: "disqualified" });
    expect(playerIn(result, 9, 0)).toBe(survivorId);
  });

  it("turns the next match into a bye for the rival when both are disqualified (UT-TO-21)", () => {
    const doubled = freezeAndDisqualify(createTestTournament(), 1, [0, 1]);
    const rivalId = playerIn(doubled, 2, 0);

    expect(getMatch(doubled, 1)).toMatchObject({ status: "finished", winnerSlot: null, outcome: "disqualified" });
    expect(getMatch(doubled, 9).status).toBe("pending");

    const resolved = startAndFinish(doubled, 2, 1);

    expect(getMatch(resolved, 9)).toMatchObject({ status: "finished", outcome: "bye", winnerSlot: 1 });
    expect(playerIn(resolved, 13, 0)).toBe(rivalId);
  });

  it("makes the other finalist champion when a semifinal is disqualified twice (UT-TO-22)", () => {
    const toSemifinals = playMatches(createTestTournament(), range(1, 30));
    const doubled = freezeAndDisqualify(toSemifinals, 61, [0, 1]);
    const semifinal2 = playMatches(doubled, [...range(31, 60), 62]);
    const championId = playerIn(semifinal2, 62, 0);

    expect(getMatch(semifinal2, 63)).toMatchObject({ status: "finished", outcome: "bye" });
    expect(semifinal2.phase).toBe("finished");
    expect(semifinal2.championId).toBe(championId);
  });

  it("leaves the tournament without a champion when the final is disqualified twice (UT-TO-23)", () => {
    const toFinal = playMatches(createTestTournament(), range(1, 62));
    const result = freezeAndDisqualify(toFinal, 63, [0, 1]);

    expect(result.phase).toBe("finished");
    expect(result.championId).toBeNull();
    expect(result.log[0].message).toBe(TOURNAMENT_COPY.log.noChampion);
  });
});

describe("revert_result", () => {
  it("puts the match back to active and removes the player from the next match (UT-TO-18)", () => {
    const tournament = createTestTournament();

    const noShow = run(run(tournament, { type: "start_match", matchId: idOf(tournament, 1) }), {
      type: "mark_no_show",
      matchId: idOf(tournament, 1),
      slots: [1],
    });

    const reverted = run(noShow, { type: "revert_result", matchId: idOf(noShow, 1) });

    expect(getMatch(reverted, 1)).toMatchObject({ status: "active", winnerSlot: null, outcome: null });
    expect(getMatch(reverted, 9).slots[0]).toMatchObject({ playerId: null, resolved: false });
  });

  it("rejects the revert once the next match has started (UT-TO-19)", () => {
    const tournament = createTestTournament();

    const noShow = run(run(tournament, { type: "start_match", matchId: idOf(tournament, 1) }), {
      type: "mark_no_show",
      matchId: idOf(tournament, 1),
      slots: [1],
    });

    const started = run(startAndFinish(noShow, 2), { type: "start_match", matchId: idOf(noShow, 9) });

    expect(() => run(started, { type: "revert_result", matchId: idOf(started, 1) })).toThrow(TournamentRuleError);
  });

  it("also takes back the byes that the result caused", () => {
    const doubled = freezeAndDisqualify(createTestTournament(), 1, [0, 1]);
    const resolved = startAndFinish(doubled, 2, 1);
    const reverted = run(resolved, { type: "revert_result", matchId: idOf(resolved, 1) });

    expect(getMatch(reverted, 1).status).toBe("active");
    expect(getMatch(reverted, 9)).toMatchObject({ status: "pending", winnerSlot: null, outcome: null });
    expect(getMatch(reverted, 13).slots[0]).toMatchObject({ playerId: null, resolved: false });
  });

  it("reopens the tournament when the final result is reverted", () => {
    const toFinal = playMatches(createTestTournament(), range(1, 62));

    const noShow = run(run(toFinal, { type: "start_match", matchId: idOf(toFinal, 63) }), {
      type: "mark_no_show",
      matchId: idOf(toFinal, 63),
      slots: [1],
    });

    const reverted = run(noShow, { type: "revert_result", matchId: idOf(noShow, 63) });

    expect(noShow.phase).toBe("finished");
    expect(reverted.phase).toBe("running");
    expect(reverted.championId).toBeNull();
    expect(getMatch(reverted, 63).status).toBe("active");
  });

  it("does not revert a match that was played", () => {
    const played = startAndFinish(createTestTournament(), 1);

    expect(() => run(played, { type: "revert_result", matchId: idOf(played, 1) })).toThrow(ERRORS.notRevertible);
  });
});

describe("a whole tournament", () => {
  it("is decided in 63 played matches with 64 players", () => {
    const finished = playUntilFinished(createTestTournament(64));

    expect(finished.phase).toBe("finished");
    expect(finished.championId).not.toBeNull();
    expect(finished.matches.every((match) => match.status === "finished")).toBe(true);
    expect(finished.matches.filter((match) => match.outcome === "played")).toHaveLength(63);
  });

  it("is decided in 39 played matches and 24 byes with 40 players", () => {
    const finished = playUntilFinished(createTestTournament(40));

    expect(finished.phase).toBe("finished");
    expect(finished.matches.filter((match) => match.outcome === "played")).toHaveLength(39);
    expect(finished.matches.filter((match) => match.outcome === "bye")).toHaveLength(24);
    expect(finished.championId).not.toBeNull();
  });
});

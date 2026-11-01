import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import {
  getChampionTag,
  getMatchPlayers,
  getSections,
  getStatusCounts,
  sortForCapture,
} from "@features/tournament/lib/tournament-view";
import { applyCommand } from "@features/tournament/lib/tournament-engine";
import {
  createTestTournament,
  freezeAndDisqualify,
  getMatch,
  NOW,
  playMatches,
  playUntilFinished,
  startAndFinish,
} from "@features/tournament/__tests__/tournament-test-utils";

describe("getSections", () => {
  const tournament = createTestTournament();

  it("gives the administrator every area in bracket order", () => {
    const sections = getSections(tournament, { isAdmin: true, desk: null });

    expect(sections.map((section) => section.area)).toEqual([
      "board_1",
      "board_2",
      "board_3",
      "board_4",
      "semifinal_1",
      "semifinal_2",
      "final",
    ]);
    expect(sections.flatMap((section) => section.matches)).toHaveLength(63);
  });

  it("gives desk 1 its boards, the first semifinal and the final", () => {
    const sections = getSections(tournament, { isAdmin: false, desk: 1 });

    expect(sections.map((section) => section.area)).toEqual(["board_1", "board_2", "semifinal_1", "final"]);
  });

  it("gives desk 2 its boards and the second semifinal", () => {
    const sections = getSections(tournament, { isAdmin: false, desk: 2 });

    expect(sections.map((section) => section.area)).toEqual(["board_3", "board_4", "semifinal_2"]);
  });

  it("gives a staff member without a desk nothing", () => {
    expect(getSections(tournament, { isAdmin: false, desk: null })).toEqual([]);
  });
});

describe("sortForCapture", () => {
  it("puts what needs attention first and keeps the bracket order inside each group", () => {
    const started = applyCommand(
      createTestTournament(),
      { type: "start_match", matchId: getMatch(createTestTournament(), 3).id },
      NOW,
    );

    const played = startAndFinish(started, 1);
    const matches = sortForCapture(played.matches.filter((match) => match.area === "board_1"));

    expect(matches.slice(0, 1).map((match) => match.number)).toEqual([3]);
    expect(matches.slice(1, 7).map((match) => match.status)).toEqual(Array(6).fill("ready"));
    expect(matches.slice(7, 14).map((match) => match.status)).toEqual(Array(7).fill("pending"));
    expect(matches.at(-1)).toMatchObject({ number: 1, status: "finished" });
  });
});

describe("getMatchPlayers", () => {
  it("names the players, BYE for an empty place and a placeholder for a place still open", () => {
    const tournament = createTestTournament(40);
    const byeMatch = tournament.matches.find((match) => match.round === 1 && match.outcome === "bye");

    if (!byeMatch) throw new Error("Expected a bye in the first round");

    const tags = getMatchPlayers(tournament, byeMatch).map((player) => player.tag);
    const open = getMatch(createTestTournament(64), 9);

    expect(tags).toContain(TOURNAMENT_COPY.bye);
    expect(getMatchPlayers(createTestTournament(64), open).map((player) => player.tag)).toEqual([
      TOURNAMENT_COPY.tbd,
      TOURNAMENT_COPY.tbd,
    ]);
  });

  it("marks the winner of a finished match", () => {
    const tournament = startAndFinish(createTestTournament(), 1, 1);
    const [first, second] = getMatchPlayers(tournament, getMatch(tournament, 1));

    expect(first.isWinner).toBe(true);
    expect(second.isWinner).toBe(false);
  });
});

describe("getStatusCounts", () => {
  it("counts the matches by what the staff has to do with them", () => {
    const tournament = createTestTournament();
    const played = playMatches(tournament, [1, 2]);
    const frozen = freezeAndDisqualify(played, 3, [0]);

    expect(getStatusCounts(tournament.matches)).toEqual({ ready: 32, active: 0, finished: 0, frozen: 0 });
    expect(getStatusCounts(played.matches)).toEqual({ ready: 31, active: 0, finished: 2, frozen: 0 });
    expect(getStatusCounts(frozen.matches)).toEqual({ ready: 30, active: 0, finished: 3, frozen: 0 });

    const busy = applyCommand(
      applyCommand(played, { type: "start_match", matchId: getMatch(played, 4).id }, NOW),
      { type: "freeze_match", matchId: getMatch(played, 5).id },
      NOW,
    );

    expect(getStatusCounts(busy.matches)).toEqual({ ready: 29, active: 1, finished: 2, frozen: 1 });
  });
});

describe("getChampionTag", () => {
  it("is null while the final is open", () => {
    expect(getChampionTag(createTestTournament())).toBeNull();
  });

  it("names the champion once the tournament is over", () => {
    const finished = playUntilFinished(createTestTournament());
    const champion = finished.players.find((player) => player.id === finished.championId);

    expect(getChampionTag(finished)).toBe(champion?.tag);
  });

  it("is null when the tournament ended without a champion", () => {
    const toFinal = playMatches(
      createTestTournament(),
      Array.from({ length: 62 }, (_, index) => index + 1),
    );

    const noChampion = freezeAndDisqualify(toFinal, 63, [0, 1]);

    expect(noChampion.phase).toBe("finished");
    expect(getChampionTag(noChampion)).toBeNull();
  });
});

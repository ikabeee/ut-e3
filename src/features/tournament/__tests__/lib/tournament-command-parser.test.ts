import { parseTournamentCommand } from "@features/tournament/lib/tournament-command-parser";

function createForm(fields: Record<string, string | string[]>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => {
    [value].flat().forEach((item) => form.append(name, item));
  });

  return form;
}

describe("parseTournamentCommand", () => {
  it.each(["start_match", "freeze_match", "unfreeze_match", "revert_result"])(
    "reads %s from the match id alone",
    (type) => {
      expect(parseTournamentCommand(createForm({ type, matchId: "match-1" }))).toEqual({
        isValid: true,
        command: { type, matchId: "match-1" },
      });
    },
  );

  it("reads the loser of finish_match from a single slot", () => {
    const form = createForm({ type: "finish_match", matchId: "match-1", slot: "1" });

    expect(parseTournamentCommand(form)).toEqual({
      isValid: true,
      command: { type: "finish_match", matchId: "match-1", loserSlot: 1 },
    });
  });

  it.each(["mark_no_show", "disqualify"])("reads one or two slots for %s", (type) => {
    expect(parseTournamentCommand(createForm({ type, matchId: "match-1", slot: "0" }))).toEqual({
      isValid: true,
      command: { type, matchId: "match-1", slots: [0] },
    });
    expect(parseTournamentCommand(createForm({ type, matchId: "match-1", slot: ["0", "1"] }))).toEqual({
      isValid: true,
      command: { type, matchId: "match-1", slots: [0, 1] },
    });
  });

  it.each([
    ["no type", { matchId: "match-1" }],
    ["an unknown type", { type: "delete_everything", matchId: "match-1" }],
    ["no match id", { type: "start_match" }],
    ["an empty match id", { type: "start_match", matchId: "  " }],
    ["finish_match without a slot", { type: "finish_match", matchId: "match-1" }],
    ["finish_match with two slots", { type: "finish_match", matchId: "match-1", slot: ["0", "1"] }],
    ["a slot outside 0 and 1", { type: "finish_match", matchId: "match-1", slot: "2" }],
    ["a slot that is not a number", { type: "finish_match", matchId: "match-1", slot: "abc" }],
    ["mark_no_show without slots", { type: "mark_no_show", matchId: "match-1" }],
    ["a repeated slot", { type: "disqualify", matchId: "match-1", slot: ["1", "1"] }],
    ["three slots", { type: "disqualify", matchId: "match-1", slot: ["0", "1", "0"] }],
  ])("rejects %s", (_case, fields) => {
    expect(parseTournamentCommand(createForm(fields))).toEqual({ isValid: false });
  });

  it("rejects a match id that arrives as a file", () => {
    const form = createForm({ type: "start_match" });

    form.append("matchId", new File(["match-1"], "match-1.txt"));

    expect(parseTournamentCommand(form)).toEqual({ isValid: false });
  });
});

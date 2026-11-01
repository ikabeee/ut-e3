import { buildBracket } from "@features/tournament/lib/bracket-layout";
import { ADMIN_ONLY_COMMANDS, canRunCommand, getMatchDesk } from "@features/tournament/lib/tournament-rules";
import type { TournamentCommandType } from "@features/tournament/lib/types";
import { range } from "@features/tournament/__tests__/tournament-test-utils";

describe("getMatchDesk", () => {
  const matches = buildBracket();

  it("gives desk 1 the boards 1 and 2, the first semifinal and the final", () => {
    const desk1 = matches.filter((match) => getMatchDesk(match) === 1).map((match) => match.number);

    expect(desk1).toEqual([...range(1, 30), 61, 63]);
  });

  it("gives desk 2 the boards 3 and 4 and the second semifinal", () => {
    const desk2 = matches.filter((match) => getMatchDesk(match) === 2).map((match) => match.number);

    expect(desk2).toEqual([...range(31, 60), 62]);
  });
});

describe("ADMIN_ONLY_COMMANDS", () => {
  it("keeps freezing, disqualifying and reverting for the KOF administrator", () => {
    expect([...ADMIN_ONLY_COMMANDS].toSorted()).toEqual([
      "disqualify",
      "freeze_match",
      "revert_result",
      "unfreeze_match",
    ]);
  });
});

describe("canRunCommand", () => {
  const matches = buildBracket();
  const byNumber = (number: number) => matches[number - 1];
  const staffCommands: TournamentCommandType[] = ["start_match", "finish_match", "mark_no_show"];
  const adminCommands: TournamentCommandType[] = ["freeze_match", "unfreeze_match", "disqualify", "revert_result"];

  it("lets the KOF administrator run any command on any match (UT-TO-15)", () => {
    [...staffCommands, ...adminCommands].forEach((type) => {
      matches.forEach((match) => {
        expect(canRunCommand({ role: "kof_admin", desk: null }, type, match)).toBe(true);
      });
    });
  });

  it("lets a staff member capture only the matches of its own desk (UT-TO-14)", () => {
    staffCommands.forEach((type) => {
      expect(canRunCommand({ role: "kof_staff", desk: 1 }, type, byNumber(1))).toBe(true);
      expect(canRunCommand({ role: "kof_staff", desk: 1 }, type, byNumber(61))).toBe(true);
      expect(canRunCommand({ role: "kof_staff", desk: 1 }, type, byNumber(63))).toBe(true);
      expect(canRunCommand({ role: "kof_staff", desk: 1 }, type, byNumber(31))).toBe(false);
      expect(canRunCommand({ role: "kof_staff", desk: 2 }, type, byNumber(31))).toBe(true);
      expect(canRunCommand({ role: "kof_staff", desk: 2 }, type, byNumber(62))).toBe(true);
      expect(canRunCommand({ role: "kof_staff", desk: 2 }, type, byNumber(1))).toBe(false);
      expect(canRunCommand({ role: "kof_staff", desk: 2 }, type, byNumber(63))).toBe(false);
    });
  });

  it("never lets a staff member freeze, disqualify or revert, even on its own desk", () => {
    adminCommands.forEach((type) => {
      expect(canRunCommand({ role: "kof_staff", desk: 1 }, type, byNumber(1))).toBe(false);
      expect(canRunCommand({ role: "kof_staff", desk: 2 }, type, byNumber(31))).toBe(false);
    });
  });

  it("lets a staff member without a desk capture nothing", () => {
    staffCommands.forEach((type) => {
      matches.forEach((match) => {
        expect(canRunCommand({ role: "kof_staff", desk: null }, type, match)).toBe(false);
      });
    });
  });
});

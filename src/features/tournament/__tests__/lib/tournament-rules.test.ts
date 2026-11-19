import { buildBracket } from "@features/tournament/lib/bracket-layout";
import {
  ADMIN_ONLY_COMMANDS,
  canRunCommand,
  canViewEntries,
  getMatchDesk,
  MATCHES_PER_BOARD,
} from "@features/tournament/lib/tournament-rules";
import type { TournamentCommandType } from "@features/tournament/lib/types";
import { range } from "@features/tournament/__tests__/tournament-test-utils";

describe("getMatchDesk", () => {
  const matches = buildBracket();

  it.each([
    [1, range(1, 15)],
    [2, range(16, 30)],
    [3, range(31, 45)],
    [4, range(46, 60)],
  ])("gives desk %i only its own board", (desk, numbers) => {
    const matchesOfDesk = matches.filter((match) => getMatchDesk(match) === desk).map((match) => match.number);

    expect(matchesOfDesk).toEqual(numbers);
  });

  it("gives the semifinals and the final no desk, so only the KOF administrator captures them", () => {
    const withoutDesk = matches.filter((match) => getMatchDesk(match) === null).map((match) => match.number);

    expect(withoutDesk).toEqual([61, 62, 63]);
  });
});

// S26: the list of participants is for the sysadmin and the KOF administrator only.
describe("canViewEntries", () => {
  it.each(["sysadmin", "kof_admin"])("lets %s see the participants", (role) => {
    expect(canViewEntries(role)).toBe(true);
  });

  it.each(["kof_staff", "stand_admin", "stand_staff", "raffle_admin", "help_desk", ""])(
    "keeps the participants from %p",
    (role) => {
      expect(canViewEntries(role)).toBe(false);
    },
  );
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

  it("lets a staff member capture only the matches of its own board (UT-TO-14)", () => {
    const desks = [1, 2, 3, 4] as const;
    const deskOfBoard = (number: number) => desks[Math.floor((number - 1) / MATCHES_PER_BOARD)];

    staffCommands.forEach((type) => {
      for (const number of range(1, 60)) {
        for (const desk of desks) {
          expect(canRunCommand({ role: "kof_staff", desk }, type, byNumber(number))).toBe(desk === deskOfBoard(number));
        }
      }
    });
  });

  it("keeps the semifinals and the final for the KOF administrator, whatever the desk", () => {
    staffCommands.forEach((type) => {
      for (const number of [61, 62, 63]) {
        for (const desk of [1, 2, 3, 4] as const) {
          expect(canRunCommand({ role: "kof_staff", desk }, type, byNumber(number))).toBe(false);
        }

        expect(canRunCommand({ role: "kof_admin", desk: null }, type, byNumber(number))).toBe(true);
      }
    });
  });

  it("never lets a staff member freeze, disqualify or revert, even on its own desk", () => {
    adminCommands.forEach((type) => {
      expect(canRunCommand({ role: "kof_staff", desk: 1 }, type, byNumber(1))).toBe(false);
      expect(canRunCommand({ role: "kof_staff", desk: 2 }, type, byNumber(16))).toBe(false);
      expect(canRunCommand({ role: "kof_staff", desk: 4 }, type, byNumber(46))).toBe(false);
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

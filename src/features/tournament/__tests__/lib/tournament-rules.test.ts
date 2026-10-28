import { buildBracket } from "@features/tournament/lib/bracket-layout";
import { ADMIN_ONLY_COMMANDS, getMatchDesk } from "@features/tournament/lib/tournament-rules";
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

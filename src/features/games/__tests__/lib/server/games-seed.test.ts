import { INITIAL_GAMES } from "@features/games/lib/server/games-seed";
import { formatStandCode } from "@features/games/lib/stand-code";

const EVENT_STANDS = [
  "ZA-S1",
  "ZA-S2",
  "ZA-S3",
  "ZB-S1",
  "ZB-S2",
  "ZB-S3",
  "ZC-S1",
  "ZC-S2",
  "ZC-S3",
  "ZD-S1",
  "ZD-S2",
  "ZD-S3",
  "ZT-S1",
  "ZT-S2",
  "ZT-S3",
  "ZT-S4",
  "ZT-S5",
  "ZT-S6",
];

describe("INITIAL_GAMES", () => {
  it("puts one sample game in each of the 18 stands of blocks A to D and T", () => {
    const stands = INITIAL_GAMES.map((game) => formatStandCode(game.stand));

    expect(stands.toSorted()).toEqual(EVENT_STANDS.toSorted());
  });
});

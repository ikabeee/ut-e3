import { createSnapshot, parseSnapshot, serializeSnapshot } from "@features/visitors/lib/passport-snapshot";

const SAVED_AT = "2026-11-20T18:00:00.000Z";

const PASSPORT = { gamertag: "PlayerOne", pin: "12345" };

// A copy saved before the game names existed: the stands carry only the code and whether they were visited.
const OLD_RAW = JSON.stringify({
  savedAt: SAVED_AT,
  passport: PASSPORT,
  visits: {
    visitCount: 9,
    stands: [
      { code: "ZA-S1", visited: true },
      { code: "ZA-S2", visited: false },
    ],
    tickets: [{ number: 3, milestone: 9 }],
  },
});

// S5: the offline copy (ute3.passport.v1) keeps opening the copies saved before the game names existed.
describe("passport snapshot without game names (S5)", () => {
  it("loads an old copy and reads its stands without a game name", () => {
    const snapshot = parseSnapshot(OLD_RAW);

    expect(snapshot).not.toBeNull();
    expect(snapshot?.visits.stands).toEqual([
      { code: "ZA-S1", visited: true, gameName: null },
      { code: "ZA-S2", visited: false, gameName: null },
    ]);
  });

  it("keeps a copy with game names after saving and reading it back", () => {
    const visits = {
      visitCount: 9,
      stands: [
        { code: "ZA-S1", visited: true, gameName: "Pixel Quest" },
        { code: "ZA-S2", visited: false, gameName: "Marea Neón" },
      ],
      tickets: [{ number: 3, milestone: 9 }],
    };

    const snapshot = createSnapshot({ passport: PASSPORT, visits, now: new Date(SAVED_AT) });

    expect(parseSnapshot(serializeSnapshot(snapshot))).toEqual(snapshot);
  });
});

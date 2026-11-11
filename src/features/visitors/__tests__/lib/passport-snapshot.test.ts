import {
  createSnapshot,
  describeSnapshotAge,
  parseSnapshot,
  serializeSnapshot,
} from "@features/visitors/lib/passport-snapshot";
import type { PassportVisits } from "@features/visitors/lib/types";

const SAVED_AT = new Date("2026-11-20T18:00:00.000Z");

const VISITS: PassportVisits = {
  visitCount: 9,
  stands: [
    { code: "ZA-S1", visited: true },
    { code: "ZA-S2", visited: false },
  ],
  tickets: [{ number: 3, milestone: 9 }],
};

const PASSPORT = { gamertag: "PlayerOne", pin: "12345" };

describe("the saved copy of the passport (RNF-14)", () => {
  it("keeps the PIN, the gamertag, the visits and the moment it was loaded", () => {
    expect(createSnapshot({ passport: PASSPORT, visits: VISITS, now: SAVED_AT })).toEqual({
      savedAt: "2026-11-20T18:00:00.000Z",
      passport: PASSPORT,
      visits: VISITS,
    });
  });

  it("returns what it saved", () => {
    const snapshot = createSnapshot({ passport: PASSPORT, visits: VISITS, now: SAVED_AT });

    expect(parseSnapshot(serializeSnapshot(snapshot))).toEqual(snapshot);
  });

  it("has no copy when nothing was saved", () => {
    expect(parseSnapshot(null)).toBeNull();
  });

  it.each([
    ["text that is not JSON", "{not json"],
    ["an array", "[]"],
    ["a copy without visits", JSON.stringify({ savedAt: SAVED_AT.toISOString(), passport: PASSPORT })],
    ["a copy with a wrong date", JSON.stringify({ savedAt: "yesterday", passport: PASSPORT, visits: VISITS })],
    [
      "a PIN that is a number",
      JSON.stringify({ savedAt: SAVED_AT.toISOString(), passport: { gamertag: "A", pin: 12345 }, visits: VISITS }),
    ],
    [
      "stands of the wrong shape",
      JSON.stringify({
        savedAt: SAVED_AT.toISOString(),
        passport: PASSPORT,
        visits: { ...VISITS, stands: [{ code: 1 }] },
      }),
    ],
  ])("never shows a broken copy: %s", (_label, raw) => {
    expect(parseSnapshot(raw)).toBeNull();
  });
});

describe("describeSnapshotAge: Datos de hace X", () => {
  const now = (milliseconds: number) => SAVED_AT.getTime() + milliseconds;

  it.each([
    [0, "hace un momento"],
    [59_000, "hace un momento"],
    [60_000, "hace 1 min"],
    [5 * 60_000 + 30_000, "hace 5 min"],
    [59 * 60_000, "hace 59 min"],
    [60 * 60_000, "hace 1 h"],
    [23 * 60 * 60_000, "hace 23 h"],
    [24 * 60 * 60_000, "hace 1 día"],
    [3 * 24 * 60 * 60_000, "hace 3 días"],
  ])("after %i ms says %s", (elapsed, expected) => {
    expect(describeSnapshotAge({ savedAt: SAVED_AT.toISOString(), now: now(elapsed) })).toBe(expected);
  });

  it("does not say a negative time when the clock of the phone went back", () => {
    expect(describeSnapshotAge({ savedAt: SAVED_AT.toISOString(), now: now(-10_000) })).toBe("hace un momento");
  });
});

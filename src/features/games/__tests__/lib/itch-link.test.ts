import { resolveItchLink } from "@features/games/lib/itch-link";

// 16:30 in America/Cancun (UTC-5) on the event day, the seeded itchOpensAt.
const ITCH_OPENS_AT = "2026-11-20T21:30:00.000Z";

const ITCH_URL = "https://utg.itch.io/ceniza-protocol";

describe("resolveItchLink", () => {
  it("UT-GA-01: hides the link and announces the activation time at 16:29", () => {
    const now = new Date("2026-11-20T21:29:00.000Z");

    expect(resolveItchLink({ itchUrl: ITCH_URL, itchOpensAt: ITCH_OPENS_AT, now })).toEqual({
      status: "pending",
      opensAt: ITCH_OPENS_AT,
    });
  });

  it("UT-GA-02: shows the link at 16:30", () => {
    const now = new Date(ITCH_OPENS_AT);

    expect(resolveItchLink({ itchUrl: ITCH_URL, itchOpensAt: ITCH_OPENS_AT, now })).toEqual({
      status: "open",
      url: ITCH_URL,
    });
  });

  it("UT-GA-03: shows nothing at 18:00 for a game without a link", () => {
    const now = new Date("2026-11-20T23:00:00.000Z");

    expect(resolveItchLink({ itchUrl: null, itchOpensAt: ITCH_OPENS_AT, now })).toEqual({ status: "hidden" });
  });

  it("shows nothing before 16:30 for a game without a link", () => {
    const now = new Date("2026-11-20T21:29:00.000Z");

    expect(resolveItchLink({ itchUrl: null, itchOpensAt: ITCH_OPENS_AT, now })).toEqual({ status: "hidden" });
  });
});

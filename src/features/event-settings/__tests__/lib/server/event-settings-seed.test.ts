import { INITIAL_EVENT_SETTINGS } from "@features/event-settings/lib/server/event-settings-seed";

describe("INITIAL_EVENT_SETTINGS", () => {
  it("opens the KOF pre-list on 13 Nov 2026 at 00:00 Cancun", () => {
    expect(INITIAL_EVENT_SETTINGS.kofRegistrationOpensAt).toBe("2026-11-13T05:00:00.000Z");
  });

  it("checks in the pre-listed KOF players from 11:00 to 12:00 Cancun on the event day", () => {
    expect(INITIAL_EVENT_SETTINGS.kofCheckInStartsAt).toBe("2026-11-20T16:00:00.000Z");
    expect(INITIAL_EVENT_SETTINGS.kofCheckInEndsAt).toBe("2026-11-20T17:00:00.000Z");
  });

  it("signs up KOF players on site from 12:00 to 12:45 Cancun", () => {
    expect(INITIAL_EVENT_SETTINGS.kofOnsiteSignupStartsAt).toBe("2026-11-20T17:00:00.000Z");
    expect(INITIAL_EVENT_SETTINGS.kofOnsiteSignupEndsAt).toBe("2026-11-20T17:45:00.000Z");
  });

  it("generates the KOF bracket at 13:00 Cancun", () => {
    expect(INITIAL_EVENT_SETTINGS.kofBracketGeneratesAt).toBe("2026-11-20T18:00:00.000Z");
  });

  it("no longer has a KOF registration close", () => {
    expect(INITIAL_EVENT_SETTINGS).not.toHaveProperty("kofRegistrationClosesAt");
  });

  it("keeps the other settings", () => {
    expect(INITIAL_EVENT_SETTINGS).toMatchObject({
      eventStartsAt: "2026-11-20T17:00:00.000Z",
      eventEndsAt: "2026-11-21T00:00:00.000Z",
      checkInCutoffAt: "2026-11-20T22:00:00.000Z",
      raffleStartsAt: "2026-11-20T23:00:00.000Z",
    });
  });
});

import { clampScannedAt, isLateVisit } from "@features/stands/lib/visit-timing";

// The hours of the seed in Cancun (UTC-5): opening at 12:00, cutoff at 16:50 and raffle at 18:00.
const WINDOW = {
  eventStartsAt: new Date("2026-11-20T17:00:00.000Z"),
  checkInCutoffAt: new Date("2026-11-20T21:50:00.000Z"),
  raffleStartsAt: new Date("2026-11-20T23:00:00.000Z"),
};

const at = (time: string) => new Date(`2026-11-20T${time}:00.000Z`);

describe("clampScannedAt", () => {
  it("brings an hour after the arrival back to the arrival (UT-CI-11)", () => {
    expect(clampScannedAt(at("21:00"), at("20:00"), WINDOW.eventStartsAt)).toEqual(at("20:00"));
  });

  it("brings an hour before the opening up to the opening (UT-CI-24)", () => {
    expect(clampScannedAt(at("14:00"), at("20:00"), WINDOW.eventStartsAt)).toEqual(WINDOW.eventStartsAt);
  });

  it("keeps an hour between the opening and the arrival", () => {
    expect(clampScannedAt(at("19:00"), at("20:00"), WINDOW.eventStartsAt)).toEqual(at("19:00"));
  });
});

describe("isLateVisit", () => {
  it("accepts a PIN of 16:49 that arrives at 17:40 (UT-CI-08)", () => {
    expect(isLateVisit(at("21:49"), at("22:40"), WINDOW)).toBe(false);
  });

  it("refuses a PIN of 16:51 (UT-CI-09)", () => {
    expect(isLateVisit(at("21:51"), at("21:52"), WINDOW)).toBe(true);
  });

  it("refuses a PIN of 16:49 that arrives at 18:00, when the raffle starts (UT-CI-10)", () => {
    expect(isLateVisit(at("21:49"), at("23:00"), WINDOW)).toBe(true);
  });
});

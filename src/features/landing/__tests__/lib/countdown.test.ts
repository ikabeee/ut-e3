import { getCountdownParts, padCountdownValue, splitClockTime } from "@features/landing/lib/countdown";

const TARGET = "2026-11-20T10:00:00-05:00";
const TARGET_MS = new Date(TARGET).getTime();
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("getCountdownParts", () => {
  it("splits the remaining time into days, hours, minutes and seconds", () => {
    const now = TARGET_MS - (24 * DAY + 5 * HOUR + 12 * MINUTE + 32 * SECOND);

    expect(getCountdownParts(TARGET, now)).toEqual({ days: 24, hours: 5, minutes: 12, seconds: 32 });
  });

  it("drops the partial second", () => {
    expect(getCountdownParts(TARGET, TARGET_MS - 1500)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 1 });
  });

  it("clamps at zero at the start and after it", () => {
    const zero = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    expect(getCountdownParts(TARGET, TARGET_MS)).toEqual(zero);
    expect(getCountdownParts(TARGET, TARGET_MS + 5 * DAY)).toEqual(zero);
  });
});

describe("padCountdownValue", () => {
  it("pads to two digits", () => {
    expect(padCountdownValue(5)).toBe("05");
    expect(padCountdownValue(24)).toBe("24");
    expect(padCountdownValue(120)).toBe("120");
  });
});

describe("splitClockTime", () => {
  it("converts a 24 hour time to a 12 hour time with its period", () => {
    expect(splitClockTime("13:30")).toEqual({ time: "1:30", period: "PM" });
    expect(splitClockTime("10:00")).toEqual({ time: "10:00", period: "AM" });
    expect(splitClockTime("00:15")).toEqual({ time: "12:15", period: "AM" });
    expect(splitClockTime("12:00")).toEqual({ time: "12:00", period: "PM" });
  });
});

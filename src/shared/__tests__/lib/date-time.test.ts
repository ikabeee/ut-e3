import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";

describe("formatTimeOfDay", () => {
  it("shows a UTC instant as Cancun time on a 24-hour clock", () => {
    expect(formatTimeOfDay("2026-11-20T17:00:00.000Z")).toBe("12:00");
  });

  it("keeps the minutes", () => {
    expect(formatTimeOfDay("2026-11-20T21:30:00.000Z")).toBe("16:30");
  });

  it("shows evening times after midnight UTC on the Cancun clock", () => {
    expect(formatTimeOfDay("2026-11-21T00:00:00.000Z")).toBe("19:00");
  });
});

describe("formatEventDate", () => {
  it("shows day, month and four-digit year separated by dots", () => {
    expect(formatEventDate("2026-11-20T17:00:00.000Z", "numeric")).toBe("20.11.2026");
  });

  it("can show a two-digit year", () => {
    expect(formatEventDate("2026-11-20T17:00:00.000Z", "2-digit")).toBe("20.11.26");
  });

  it("uses the Cancun day for an instant that is already the next day in UTC", () => {
    expect(formatEventDate("2026-11-21T00:00:00.000Z", "numeric")).toBe("20.11.2026");
  });
});

import { formatCancunDateTimeInput, parseCancunDateTimeInput } from "@shared/lib/date-time";

describe("parseCancunDateTimeInput", () => {
  it("reads a datetime-local value as Cancun time and returns the UTC instant", () => {
    expect(parseCancunDateTimeInput("2026-11-20T12:00")).toBe("2026-11-20T17:00:00.000Z");
    expect(parseCancunDateTimeInput("2026-11-20T23:30")).toBe("2026-11-21T04:30:00.000Z");
  });

  it.each(["", "mañana", "2026-11-20", "2026-13-40T12:00", "2026-02-30T12:00", "2026-11-20T25:00"])(
    "returns null for %p",
    (value) => {
      expect(parseCancunDateTimeInput(value)).toBeNull();
    },
  );
});

describe("formatCancunDateTimeInput", () => {
  it("writes a UTC instant as the datetime-local value a Cancun visitor sees", () => {
    expect(formatCancunDateTimeInput("2026-11-20T17:00:00.000Z")).toBe("2026-11-20T12:00");
    expect(formatCancunDateTimeInput("2026-11-21T04:30:00.000Z")).toBe("2026-11-20T23:30");
  });
});

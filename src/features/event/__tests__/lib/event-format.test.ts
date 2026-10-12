import {
  buildGoogleCalendarUrl,
  formatCopyableAddress,
  formatDateLabel,
  formatHoursLabel,
  formatShortDateLabel,
  formatVenueAddress,
} from "@features/event/lib/event-format";

const STARTS_AT = "2026-11-27T10:00:00-05:00";
const ENDS_AT = "2026-11-27T20:00:00-05:00";

describe("event date labels", () => {
  it("writes the date and hours as they are in Cancún, without converting time zones", () => {
    expect(formatDateLabel(STARTS_AT)).toBe("27.11.2026");
    expect(formatShortDateLabel(STARTS_AT)).toBe("27.11.26");
    expect(formatHoursLabel(STARTS_AT, ENDS_AT)).toBe("10:00—20:00");
  });

  it("rejects a date that is not ISO 8601", () => {
    expect(() => formatDateLabel("27/11/2026")).toThrow("Fecha inválida");
  });
});

describe("buildGoogleCalendarUrl", () => {
  it("prefills the event with its dates in UTC", () => {
    const url = new URL(
      buildGoogleCalendarUrl({
        title: "UTG",
        startsAt: STARTS_AT,
        endsAt: ENDS_AT,
        details: "Showcase.",
        location: "UT Cancún",
      }),
    );

    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      action: "TEMPLATE",
      text: "UTG",
      dates: "20261127T150000Z/20261128T010000Z",
      details: "Showcase.",
      location: "UT Cancún",
    });
  });
});

describe("venue address", () => {
  const venue = {
    name: "UT Cancún",
    streetAddress: "Km 11.5",
    postalCode: "77565",
    locality: "Cancún",
    region: "Quintana Roo",
  };

  it("builds the visible address and the one to copy from the same parts", () => {
    expect(formatVenueAddress(venue)).toBe("Km 11.5, C.P. 77565, Cancún, Quintana Roo.");
    expect(formatCopyableAddress(venue)).toBe("UT Cancún, Km 11.5, C.P. 77565, Cancún, Quintana Roo");
  });
});

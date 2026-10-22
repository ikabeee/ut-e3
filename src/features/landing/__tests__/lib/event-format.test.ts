import {
  buildGoogleCalendarUrl,
  formatDayMonthYearLabel,
  formatMonthDayYearLabel,
  formatVenueAddress,
} from "@features/landing/lib/event-format";

const STARTS_AT = "2026-11-27T10:00:00-05:00";

const ENDS_AT = "2026-11-27T20:00:00-05:00";

describe("event date labels in Spanish words", () => {
  it("writes the day, the abbreviated month and the year", () => {
    expect(formatDayMonthYearLabel(STARTS_AT)).toBe("27 Nov 2026");
    expect(formatDayMonthYearLabel("2026-01-05T09:00:00-05:00")).toBe("5 Ene 2026");
  });

  it("writes the full month, the day and the year", () => {
    expect(formatMonthDayYearLabel(STARTS_AT)).toBe("Noviembre 27, 2026");
    expect(formatMonthDayYearLabel("2026-01-05T09:00:00-05:00")).toBe("Enero 5, 2026");
  });

  it("rejects a date that is not ISO 8601", () => {
    expect(() => formatDayMonthYearLabel("27/11/2026")).toThrow("Fecha inválida");
    expect(() => formatMonthDayYearLabel("27/11/2026")).toThrow("Fecha inválida");
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

describe("formatVenueAddress", () => {
  it("joins the venue name and its address parts", () => {
    const venue = {
      name: "UT Cancún",
      shortName: "UT",
      streetAddress: "Km 11.5",
      postalCode: "77565",
      locality: "Cancún",
      region: "Quintana Roo",
      country: "MX",
    };

    expect(formatVenueAddress(venue)).toBe("UT Cancún, Km 11.5, C.P. 77565, Cancún, Quintana Roo");
  });
});

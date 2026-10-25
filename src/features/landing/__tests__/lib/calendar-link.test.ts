import { buildCalendarUrl } from "@features/landing/lib/calendar-link";

const SHOWCASE = {
  title: "UTG · Showcase de videojuegos",
  details: "Entrada libre & gratuita.",
  location: "Universidad Tecnológica de Cancún, Carretera Cancún–Aeropuerto, Km 11.5",
  startsAt: "2026-11-20T17:00:00.000Z",
  endsAt: "2026-11-21T00:00:00.000Z",
};

function parseCalendarUrl() {
  return new URL(buildCalendarUrl(SHOWCASE));
}

describe("buildCalendarUrl", () => {
  it("points to the Google Calendar event template", () => {
    const url = parseCalendarUrl();

    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
  });

  it("writes the event window in UTC basic format", () => {
    expect(parseCalendarUrl().searchParams.get("dates")).toBe("20261120T170000Z/20261121T000000Z");
  });

  it("round-trips the title, details and location through URL encoding", () => {
    const { searchParams } = parseCalendarUrl();

    expect(searchParams.get("text")).toBe(SHOWCASE.title);
    expect(searchParams.get("details")).toBe(SHOWCASE.details);
    expect(searchParams.get("location")).toBe(SHOWCASE.location);
  });

  it("encodes reserved characters instead of leaving them raw", () => {
    const rawUrl = buildCalendarUrl(SHOWCASE);

    expect(rawUrl).not.toContain(" ");
    expect(rawUrl).not.toContain("& gratuita");
    expect(rawUrl).not.toContain("·");
  });
});

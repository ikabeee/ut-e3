import { render, screen, within } from "@testing-library/react";
import { LandingProgram } from "@features/landing/components/landing-program";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

const SCHEDULE = [
  { time: "10:00", title: "Apertura", zoneId: "entry", zoneTitle: "Entrada" },
  { time: "13:30", title: "Rondas de torneos", zoneId: "arena", zoneTitle: "Arena de torneos" },
];

function renderProgram() {
  return render(
    <LandingProgram
      schedule={SCHEDULE}
      dateLabel="20.11.2026"
      calendarUrl="https://calendar.example/event"
      startsAt="2026-11-20T10:00:00-05:00"
    />,
  );
}

describe("LandingProgram", () => {
  it("renders the title, subtitle, date and schedule heading", () => {
    renderProgram();

    expect(screen.getByRole("heading", { level: 2, name: LANDING_COPY.program.title })).toBeInTheDocument();
    expect(screen.getByText(LANDING_COPY.program.subtitle)).toBeInTheDocument();
    expect(screen.getByText("20.11.2026")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: LANDING_COPY.program.scheduleHeading })).toBeInTheDocument();
  });

  it("renders one row per entry with a 12 hour time and its zone", () => {
    renderProgram();

    const rows = within(screen.getByRole("list")).getAllByRole("listitem");

    expect(rows).toHaveLength(SCHEDULE.length);
    expect(within(rows[0]).getByText("Apertura")).toBeInTheDocument();
    expect(within(rows[0]).getByText("10:00")).toBeInTheDocument();
    expect(within(rows[0]).getByText("AM")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Entrada")).toBeInTheDocument();
    expect(within(rows[1]).getByText("1:30")).toBeInTheDocument();
    expect(within(rows[1]).getByText("PM")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Arena de torneos")).toBeInTheDocument();
  });

  it("links to the calendar in a new tab", () => {
    renderProgram();

    const link = screen.getByRole("link", { name: LANDING_COPY.hero.addToCalendar });

    expect(link).toHaveAttribute("href", "https://calendar.example/event");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("includes the countdown region", () => {
    renderProgram();

    expect(screen.getByRole("region", { name: LANDING_COPY.program.countdownLabel })).toBeInTheDocument();
  });
});

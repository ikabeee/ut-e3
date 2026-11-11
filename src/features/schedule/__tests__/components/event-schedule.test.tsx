import { render, screen } from "@testing-library/react";
import { EventSchedule } from "@features/schedule/components/event-schedule";
import type { ScheduleItem } from "@features/schedule/lib/types";

type ZoneLink = { href: string; label: string } | null;

function buildItem(overrides: Partial<ScheduleItem>): ScheduleItem {
  return {
    id: "opening",
    title: "Apertura",
    description: "Abren las puertas del edificio.",
    startsAt: "2026-11-20T17:00:00.000Z",
    endsAt: "2026-11-20T17:30:00.000Z",
    zone: null,
    ...overrides,
  };
}

function linkOnlyForStage(zone: string): ZoneLink {
  return zone === "stage" ? { href: "#croquis-stage", label: "Escenario" } : null;
}

describe("EventSchedule", () => {
  it("shows 'Cronograma por anunciar' when there are no items", () => {
    render(<EventSchedule heading="20.11.26" items={[]} zoneLink={linkOnlyForStage} />);

    expect(screen.getByText("Cronograma por anunciar")).toBeInTheDocument();
  });

  it("does not show the empty message when there are items", () => {
    render(<EventSchedule heading="20.11.26" items={[buildItem({})]} zoneLink={linkOnlyForStage} />);

    expect(screen.queryByText("Cronograma por anunciar")).not.toBeInTheDocument();
  });

  it("renders the heading inside the schedule section", () => {
    const { container } = render(<EventSchedule heading="20.11.26" items={[]} zoneLink={linkOnlyForStage} />);

    expect(screen.getByRole("heading", { name: "20.11.26" })).toBeInTheDocument();
    expect(container.querySelector("section#schedule")).toBeInTheDocument();
  });

  it("shows 12:00 for 2026-11-20T17:00:00.000Z in the Cancun time zone", () => {
    const { container } = render(
      <EventSchedule heading="20.11.26" items={[buildItem({})]} zoneLink={linkOnlyForStage} />,
    );

    const time = container.querySelector("time");

    expect(time).toHaveTextContent("12:00");
    expect(time).toHaveAttribute("datetime", "2026-11-20T17:00:00.000Z");
  });

  it("renders the title and the description of each item", () => {
    render(<EventSchedule heading="20.11.26" items={[buildItem({})]} zoneLink={linkOnlyForStage} />);

    expect(screen.getByText("Apertura")).toBeInTheDocument();
    expect(screen.getByText("Abren las puertas del edificio.")).toBeInTheDocument();
  });

  it("keeps the order of the given items", () => {
    const items = [
      buildItem({ id: "talk", title: "Plática", startsAt: "2026-11-20T19:00:00.000Z" }),
      buildItem({ id: "opening", title: "Apertura", startsAt: "2026-11-20T17:00:00.000Z" }),
      buildItem({ id: "raffle", title: "Rifa", startsAt: "2026-11-20T23:00:00.000Z" }),
    ];

    const { container } = render(<EventSchedule heading="20.11.26" items={items} zoneLink={linkOnlyForStage} />);

    const renderedStarts = Array.from(container.querySelectorAll("time")).map((time) => time.getAttribute("datetime"));

    expect(renderedStarts).toEqual([
      "2026-11-20T19:00:00.000Z",
      "2026-11-20T17:00:00.000Z",
      "2026-11-20T23:00:00.000Z",
    ]);
  });

  it("renders the link returned by zoneLink for an item with a zone", () => {
    render(<EventSchedule heading="20.11.26" items={[buildItem({ zone: "stage" })]} zoneLink={linkOnlyForStage} />);

    expect(screen.getByRole("link", { name: /Escenario/ })).toHaveAttribute("href", "#croquis-stage");
  });

  it("renders no link when zoneLink returns null for the zone", () => {
    render(<EventSchedule heading="20.11.26" items={[buildItem({ zone: "kof" })]} zoneLink={linkOnlyForStage} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders no link for an item without a zone", () => {
    const alwaysLink = (): ZoneLink => ({ href: "#croquis", label: "Croquis" });

    render(<EventSchedule heading="20.11.26" items={[buildItem({ zone: null })]} zoneLink={alwaysLink} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

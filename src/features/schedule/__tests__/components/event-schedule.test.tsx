import { render, screen } from "@testing-library/react";
import { EventSchedule } from "@features/schedule/components/event-schedule";
import type { ScheduleItem } from "@features/schedule/lib/types";

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

function labelOnlyForStage(zone: string): string | null {
  return zone === "stage" ? "Escenario" : null;
}

describe("EventSchedule", () => {
  it("shows 'Cronograma por anunciar' when there are no items", () => {
    render(<EventSchedule heading="20.11.26" items={[]} zoneLabel={labelOnlyForStage} />);

    expect(screen.getByText("Cronograma por anunciar")).toBeInTheDocument();
  });

  it("does not show the empty message when there are items", () => {
    render(<EventSchedule heading="20.11.26" items={[buildItem({})]} zoneLabel={labelOnlyForStage} />);

    expect(screen.queryByText("Cronograma por anunciar")).not.toBeInTheDocument();
  });

  it("renders the heading inside the schedule section", () => {
    const { container } = render(<EventSchedule heading="20.11.26" items={[]} zoneLabel={labelOnlyForStage} />);

    expect(screen.getByRole("heading", { name: "20.11.26" })).toBeInTheDocument();
    expect(container.querySelector("section#schedule")).toBeInTheDocument();
  });

  it("shows 12:00 for 2026-11-20T17:00:00.000Z in the Cancun time zone", () => {
    const { container } = render(
      <EventSchedule heading="20.11.26" items={[buildItem({})]} zoneLabel={labelOnlyForStage} />,
    );

    const time = container.querySelector("time");

    expect(time).toHaveTextContent("12:00");
    expect(time).toHaveAttribute("datetime", "2026-11-20T17:00:00.000Z");
  });

  it("renders the title and the description of each item", () => {
    render(<EventSchedule heading="20.11.26" items={[buildItem({})]} zoneLabel={labelOnlyForStage} />);

    expect(screen.getByText("Apertura")).toBeInTheDocument();
    expect(screen.getByText("Abren las puertas del edificio.")).toBeInTheDocument();
  });

  it("keeps the order of the given items", () => {
    const items = [
      buildItem({ id: "talk", title: "Plática", startsAt: "2026-11-20T19:00:00.000Z" }),
      buildItem({ id: "opening", title: "Apertura", startsAt: "2026-11-20T17:00:00.000Z" }),
      buildItem({ id: "raffle", title: "Rifa", startsAt: "2026-11-20T23:00:00.000Z" }),
    ];

    const { container } = render(<EventSchedule heading="20.11.26" items={items} zoneLabel={labelOnlyForStage} />);

    const renderedStarts = Array.from(container.querySelectorAll("time")).map((time) => time.getAttribute("datetime"));

    expect(renderedStarts).toEqual([
      "2026-11-20T19:00:00.000Z",
      "2026-11-20T17:00:00.000Z",
      "2026-11-20T23:00:00.000Z",
    ]);
  });

  it("shows the place of an item with a zone as plain text, with no link nor arrow (S24)", () => {
    render(<EventSchedule heading="20.11.26" items={[buildItem({ zone: "stage" })]} zoneLabel={labelOnlyForStage} />);

    expect(screen.getByText("Escenario")).toBeInTheDocument();
    expect(screen.getByText("Escenario").closest("a")).toBeNull();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows no place when zoneLabel returns null for the zone", () => {
    render(<EventSchedule heading="20.11.26" items={[buildItem({ zone: "kof" })]} zoneLabel={labelOnlyForStage} />);

    expect(screen.queryByText("Escenario")).not.toBeInTheDocument();
  });

  it("shows no place for an item without a zone", () => {
    render(<EventSchedule heading="20.11.26" items={[buildItem({ zone: null })]} zoneLabel={() => "Croquis"} />);

    expect(screen.queryByText("Croquis")).not.toBeInTheDocument();
  });
});

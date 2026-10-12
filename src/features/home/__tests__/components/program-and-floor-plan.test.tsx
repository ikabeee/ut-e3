import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getEventContent } from "@features/event/lib/event-content";
import { buildPlanItems } from "@features/floor-plan/lib/plan-items";
import { PLAN_ZONES } from "@features/floor-plan/lib/plan-places";
import { PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import { toStandOccupant } from "@features/games/lib/game-stand";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";
import { ProgramAndFloorPlan } from "@features/home/components/program-and-floor-plan";
import { resolveScheduleZones } from "@features/home/lib/schedule-zones";

function renderSection() {
  const event = getEventContent();
  const items = buildPlanItems(
    GAME_FIXTURES.map((game) => toStandOccupant(game, null)),
    event.highlights,
  );

  return render(
    <ProgramAndFloorPlan
      scheduleTitle={event.info.shortDateLabel}
      schedule={resolveScheduleZones(event.schedule, PLAN_ZONES)}
      items={items}
      layouts={PLAN_LAYOUTS}
    />,
  );
}

function panelTitle() {
  return screen.getAllByRole("heading", { level: 3 })[0];
}

describe("ProgramAndFloorPlan", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it("starts with stand A1 selected on the map", () => {
    renderSection();

    expect(panelTitle()).toHaveTextContent("Ceniza Protocol");
    expect(screen.getByText("Stand A1 · Acción")).toBeInTheDocument();
  });

  it("locates an activity of the program on the map", async () => {
    const user = userEvent.setup();
    renderSection();

    const [schedule] = screen.getAllByRole("list").map((list) => within(list));
    await user.click(schedule.getAllByRole("button", { name: /Arena de torneos/ })[0]);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(panelTitle()).toHaveTextContent("Arena de torneos");
  });

  it("selects a stand clicked on the map", async () => {
    const user = userEvent.setup();
    renderSection();

    const [wideMap] = screen.getAllByRole("group", { name: "Croquis del evento con zonas y stands" });
    await user.click(within(wideMap).getByRole("button", { name: "Stand C4" }));

    expect(panelTitle()).toHaveTextContent("Patrocinadores");
  });
});

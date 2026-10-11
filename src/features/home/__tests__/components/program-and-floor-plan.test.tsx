import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toStandOccupant } from "@features/games/lib/game-stand";
import { MOCK_GAMES } from "@features/games/lib/mock-games";
import { ProgramAndFloorPlan } from "@features/home/components/program-and-floor-plan";

function renderSection() {
  const occupants = MOCK_GAMES.map((game) => toStandOccupant(game, null));

  return render(<ProgramAndFloorPlan occupants={occupants} />);
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

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithGames } from "@features/games/__tests__/render-with-games";
import { ProgramAndFloorPlan } from "@features/home/components/program-and-floor-plan";

function panelTitle() {
  return screen.getAllByRole("heading", { level: 3 })[0];
}

describe("ProgramAndFloorPlan", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it("starts with stand A1 selected on the map", () => {
    renderWithGames(<ProgramAndFloorPlan />);

    expect(panelTitle()).toHaveTextContent("Ceniza Protocol");
    expect(screen.getByText("Stand A1 · Acción")).toBeInTheDocument();
  });

  it("locates an activity of the program on the map", async () => {
    const user = userEvent.setup();
    renderWithGames(<ProgramAndFloorPlan />);

    const [schedule] = screen.getAllByRole("list").map((list) => within(list));
    await user.click(schedule.getAllByRole("button", { name: /Arena de torneos/ })[0]);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(panelTitle()).toHaveTextContent("Arena de torneos");
  });

  it("selects a stand clicked on the map", async () => {
    const user = userEvent.setup();
    renderWithGames(<ProgramAndFloorPlan />);

    const [wideMap] = screen.getAllByRole("group", { name: "Croquis del evento con zonas y stands" });
    await user.click(within(wideMap).getByRole("button", { name: "Stand C4" }));

    expect(panelTitle()).toHaveTextContent("Patrocinadores");
  });
});

import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloorPlanExplorer } from "@features/floor-plan/components/floor-plan-explorer";
import { renderWithGames } from "@features/games/__tests__/render-with-games";

function panelTitle() {
  return screen.getAllByRole("heading", { level: 2 })[0];
}

describe("FloorPlanExplorer", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/floor-plan");
    Element.prototype.scrollIntoView = jest.fn();
  });

  it("selects the main stage by default", () => {
    renderWithGames(<FloorPlanExplorer />);

    expect(panelTitle()).toHaveTextContent("Main Stage");
  });

  it("opens the stand from the URL hash", async () => {
    window.history.replaceState(null, "", "/floor-plan#B7");
    renderWithGames(<FloorPlanExplorer />);
    await act(async () => undefined);

    expect(panelTitle()).toHaveTextContent("Lucha Pixel");
    expect(screen.getByText("Stand B7 · Pelea")).toBeInTheDocument();
  });

  it("selects an item from the directory and keeps it in the URL", async () => {
    const user = userEvent.setup();
    renderWithGames(<FloorPlanExplorer />);

    await user.click(screen.getByRole("button", { name: /C3\s*Oferta educativa/ }));

    expect(panelTitle()).toHaveTextContent("Oferta educativa");
    expect(window.location.hash).toBe("#C3");
  });

  it("selects a stand on the map", async () => {
    const user = userEvent.setup();
    renderWithGames(<FloorPlanExplorer />);

    const [wideMap] = screen.getAllByRole("application");
    await user.click(within(wideMap).getByRole("button", { name: "Stand A4, Ruta 9" }));

    expect(panelTitle()).toHaveTextContent("Ruta 9");
  });

  it("filters categories and restores them all from the last visible one", async () => {
    const user = userEvent.setup();
    renderWithGames(<FloorPlanExplorer />);
    const filters = within(screen.getByRole("group", { name: "Mostrar en el mapa" }));

    await user.click(filters.getByRole("button", { name: "Servicios" }));
    expect(filters.getByRole("button", { name: "Servicios" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Comida", { selector: "button span" })).not.toBeVisible();

    for (const name of ["Stands de equipo", "Stands informativos"]) {
      await user.click(filters.getByRole("button", { name }));
    }
    await user.click(filters.getByRole("button", { name: "Escenario y actividades" }));

    for (const button of filters.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-pressed", "true");
    }
  });

  it("zooms with the toolbar", async () => {
    const user = userEvent.setup();
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    renderWithGames(<FloorPlanExplorer />);

    await user.click(screen.getByRole("button", { name: "Acercar" }));

    expect(screen.getByText("150%")).toBeInTheDocument();
  });
});

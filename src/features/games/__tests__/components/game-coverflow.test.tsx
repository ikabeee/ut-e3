import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithGames } from "@features/games/__tests__/render-with-games";
import { GameCoverflowContent } from "@features/games/components/game-coverflow";

const navigate = jest.fn();

function currentCase() {
  return screen.getAllByRole("link").find((link) => link.getAttribute("aria-current") === "true");
}

describe("GameCoverflow", () => {
  it("shows the middle game in front and links every case to its page", () => {
    renderWithGames(<GameCoverflowContent navigate={navigate} />);

    expect(currentCase()).toHaveAccessibleName("Pulso Cero, Ritmo, stand A7");
    expect(currentCase()).toHaveAttribute("href", "/games/pulso-cero");
  });

  it("renders nothing while there are no published games", () => {
    const { container } = renderWithGames(<GameCoverflowContent navigate={navigate} />, []);

    expect(container).toBeEmptyDOMElement();
  });

  it("brings a side case to the front instead of opening it", async () => {
    const user = userEvent.setup();
    renderWithGames(<GameCoverflowContent navigate={navigate} />);

    await user.click(screen.getByRole("link", { name: /^Turbina/ }));

    expect(currentCase()).toHaveAccessibleName("Turbina, Carreras, stand A9");
  });

  it("stops at the first and last game", async () => {
    const user = userEvent.setup();
    renderWithGames(<GameCoverflowContent navigate={navigate} />);

    for (let step = 0; step < 12; step += 1) {
      await user.click(screen.getByRole("button", { name: "Juego siguiente" }));
    }

    expect(currentCase()).toHaveAccessibleName("Circuito 7, Puzle, stand B9");
    expect(screen.getByRole("button", { name: "Juego siguiente" })).toBeDisabled();
  });

  it("moves with the keyboard arrows", () => {
    renderWithGames(<GameCoverflowContent navigate={navigate} />);

    const selectedCase = currentCase();

    if (!selectedCase) throw new Error("El carrusel debe tener un juego seleccionado.");

    fireEvent.keyDown(selectedCase, { key: "ArrowLeft" });

    expect(currentCase()).toHaveAccessibleName("Eco/Nulo, Ritmo, stand B3");
    expect(currentCase()).toHaveFocus();
  });
});

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithGames } from "@features/games/__tests__/render-with-games";
import { GamesCatalog } from "@features/games/components/games-catalog";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";

const TOTAL = GAME_FIXTURES.length;

function getGameCards() {
  return within(screen.getByRole("region", { name: "Todos los juegos" })).queryAllByRole("link");
}

describe("GamesCatalog", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/games");
    Element.prototype.scrollIntoView = jest.fn();
  });

  it("shows every game and the total count", () => {
    renderWithGames(<GamesCatalog />);

    expect(getGameCards()).toHaveLength(TOTAL);
    expect(screen.getByText(`${TOTAL} de ${TOTAL} juegos`)).toBeInTheDocument();
  });

  it("filters by genre, keeps it in the URL and clears it when pressed again", async () => {
    const user = userEvent.setup();
    renderWithGames(<GamesCatalog />);

    await user.click(screen.getByRole("button", { name: /Puzle/ }));

    expect(getGameCards()).toHaveLength(2);
    expect(screen.getByText(`2 de ${TOTAL} juegos · Puzle`)).toBeInTheDocument();
    expect(window.location.search).toBe("?genre=Puzle");

    await user.click(screen.getByRole("button", { name: /Puzle/ }));

    expect(getGameCards()).toHaveLength(TOTAL);
    expect(window.location.search).toBe("");
  });

  it("reads the genre from the URL", () => {
    window.history.replaceState(null, "", "/games?genre=Ritmo");
    renderWithGames(<GamesCatalog />);

    expect(screen.getByText(`2 de ${TOTAL} juegos · Ritmo`)).toBeInTheDocument();
  });

  it("shows the empty state and resets the filters", async () => {
    const user = userEvent.setup();
    renderWithGames(<GamesCatalog />);

    await user.type(screen.getByRole("searchbox", { name: "Buscar juegos" }), "ajedrez");

    expect(getGameCards()).toHaveLength(0);
    expect(screen.getByText("Ningún juego coincide con tu búsqueda.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver todos los juegos" }));

    expect(getGameCards()).toHaveLength(TOTAL);
    expect(screen.getByRole("searchbox", { name: "Buscar juegos" })).toHaveValue("");
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { GamesBrowser } from "@features/games/components/games-browser";

const games = makeGames(6);

// The page keeps the genre in the URL; this harness keeps it in state so the browser can be driven like the page.
function BrowserWithGenreState({ initialGenre = null }: Readonly<{ initialGenre?: string | null }>) {
  const [genreSlug, setGenreSlug] = useState(initialGenre);

  return <GamesBrowser games={games} selectedGenreSlug={genreSlug} onSelectGenre={setGenreSlug} />;
}

function gridNames() {
  return within(gameGrid())
    .queryAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
}

function gameGrid() {
  return screen.getByRole("list", { name: "Todos los juegos" });
}

function counter() {
  return screen.getByText(/ juegos/, { selector: "[aria-live]" });
}

describe("GamesBrowser", () => {
  it("links every game to its page with its genre and stand", () => {
    render(<BrowserWithGenreState />);

    const card = within(gameGrid()).getByRole("link", { name: /Juego 02/ });

    expect(card).toHaveAttribute("href", "/games/juego-02");
    expect(card).toHaveTextContent("Puzle · ZA-S2");
    expect(screen.getByAltText("Portada de Juego 02")).toBeInTheDocument();
    expect(counter()).toHaveTextContent("6 de 6 juegos");
  });

  it("filters the grid by the selected genre and clears it when the genre is pressed again", async () => {
    const user = userEvent.setup();
    render(<BrowserWithGenreState />);

    await user.click(screen.getByRole("button", { name: /Puzle/ }));

    expect(gridNames()).toEqual(["Juego 02", "Juego 05"]);
    expect(counter()).toHaveTextContent("2 de 6 juegos · Puzle");
    expect(screen.getByRole("button", { name: /Puzle/ })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /Puzle/ }));

    expect(gridNames()).toHaveLength(6);
  });

  it("names each genre with its game count", () => {
    render(<BrowserWithGenreState />);

    expect(screen.getByRole("button", { name: /Acción/ })).toHaveTextContent("2 juegos");
  });

  it("filters the grid by the search text", async () => {
    const user = userEvent.setup();
    render(<BrowserWithGenreState />);

    await user.type(screen.getByRole("searchbox", { name: "Buscar juegos" }), "juego 04");

    expect(gridNames()).toEqual(["Juego 04"]);
    expect(counter()).toHaveTextContent("1 de 6 juegos");
  });

  it("shows the empty state when nothing matches and restores every game from it", async () => {
    const user = userEvent.setup();
    render(<BrowserWithGenreState initialGenre="racing" />);

    await user.type(screen.getByRole("searchbox", { name: "Buscar juegos" }), "cenote");

    expect(screen.getByText("Ningún juego coincide con tu búsqueda.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Todos los juegos" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver todos los juegos" }));

    expect(gridNames()).toHaveLength(6);
    expect(screen.getByRole("searchbox", { name: "Buscar juegos" })).toHaveValue("");
  });

  it("ignores a genre slug that no game has", () => {
    render(<BrowserWithGenreState initialGenre="horror" />);

    expect(gridNames()).toHaveLength(6);
    expect(counter()).toHaveTextContent("6 de 6 juegos");
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { GamesBrowser } from "@features/games/components/games-browser";

const games = makeGames(6);

// The page keeps the genre and the search in the URL; this harness keeps them in state so the browser can be driven
// like the page.
function BrowserWithUrlState({
  initialGenre = null,
  initialKeyword = "",
}: Readonly<{ initialGenre?: string | null; initialKeyword?: string }>) {
  const [genreSlug, setGenreSlug] = useState(initialGenre);
  const [keyword, setKeyword] = useState(initialKeyword);

  return (
    <GamesBrowser
      games={games}
      selectedGenreSlug={genreSlug}
      keyword={keyword}
      onSelectGenre={setGenreSlug}
      onClearKeyword={() => setKeyword("")}
      onShowAll={() => {
        setGenreSlug(null);
        setKeyword("");
      }}
    />
  );
}

function gridNames() {
  return within(gameGrid())
    .queryAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
}

function gameGrid() {
  return screen.getByRole("list", { name: "Todos los juegos" });
}

describe("GamesBrowser", () => {
  it("links every game to its page with its genre and stand", () => {
    render(<BrowserWithUrlState />);

    const card = within(gameGrid()).getByRole("link", { name: /Juego 02/ });

    expect(card).toHaveAttribute("href", "/games/juego-02");
    expect(card).toHaveTextContent("Puzle · ZA-S2");
    expect(screen.getByAltText("Portada de Juego 02")).toBeInTheDocument();
  });

  it("filters the grid by the selected genre and clears it when the genre is pressed again", async () => {
    const user = userEvent.setup();
    render(<BrowserWithUrlState />);

    await user.click(screen.getByRole("button", { name: /Puzle/ }));

    expect(gridNames()).toEqual(["Juego 02", "Juego 05"]);
    expect(screen.getByRole("button", { name: /Puzle/ })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /Puzle/ }));

    expect(gridNames()).toHaveLength(6);
  });

  it("names each genre with its game count", () => {
    render(<BrowserWithUrlState />);

    expect(screen.getByRole("button", { name: /Acción/ })).toHaveTextContent("2 juegos");
  });

  it("has no header, search input or results counter of its own (S24)", () => {
    render(<BrowserWithUrlState />);

    expect(screen.queryByText(/Explora los videojuegos del showcase/)).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/ de 6 juegos/)).not.toBeInTheDocument();
  });

  it("keeps a visually hidden h1 so the page has a title", () => {
    render(<BrowserWithUrlState />);

    expect(screen.getByRole("heading", { level: 1, name: "Catálogo de juegos" })).toHaveClass("sr-only");
  });

  it("filters the grid by the search text without case or accents", () => {
    render(<BrowserWithUrlState initialKeyword="JUEGO 04" />);

    expect(gridNames()).toEqual(["Juego 04"]);
  });

  it("matches the genre name ignoring accents", () => {
    render(<BrowserWithUrlState initialKeyword="accion" />);

    expect(gridNames()).toEqual(["Juego 01", "Juego 04"]);
  });

  it("names the active search and clears it with its own button", async () => {
    const user = userEvent.setup();
    render(<BrowserWithUrlState initialKeyword="juego 04" />);

    expect(screen.getByRole("status")).toHaveTextContent("Resultados para «juego 04»");

    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));

    expect(gridNames()).toHaveLength(6);
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).not.toBeInTheDocument();
  });

  it("shows no search note while there is no search", () => {
    render(<BrowserWithUrlState />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).not.toBeInTheDocument();
  });

  it("shows the empty state when nothing matches and restores every game from it", async () => {
    const user = userEvent.setup();
    render(<BrowserWithUrlState initialGenre="racing" initialKeyword="cenote" />);

    expect(screen.getByText("Ningún juego coincide con tu búsqueda.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Todos los juegos" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver todos los juegos" }));

    expect(gridNames()).toHaveLength(6);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("ignores a genre slug that no game has", () => {
    render(<BrowserWithUrlState initialGenre="horror" />);

    expect(gridNames()).toHaveLength(6);
  });
});

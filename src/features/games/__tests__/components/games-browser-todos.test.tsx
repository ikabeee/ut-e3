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
  return within(screen.getByRole("list", { name: "Todos los juegos" }))
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
}

describe("GamesBrowser Todos filter", () => {
  it("shows a visible Todos option that clears the genre filter", async () => {
    const user = userEvent.setup();
    render(<BrowserWithGenreState initialGenre="puzzle" />);
    expect(gridNames()).toEqual(["Juego 02", "Juego 05"]);

    await user.click(screen.getByRole("button", { name: "Todos" }));

    expect(gridNames()).toHaveLength(6);
  });

  it("keeps filtering the grid by the chosen genre", async () => {
    const user = userEvent.setup();
    render(<BrowserWithGenreState />);

    await user.click(screen.getByRole("button", { name: /Puzle/ }));

    expect(gridNames()).toEqual(["Juego 02", "Juego 05"]);
  });
});

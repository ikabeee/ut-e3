import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { GamesBrowser } from "@features/games/components/games-browser";

const games = makeGames(6);

function BrowserWithGenreState({ initialGenre = null }: Readonly<{ initialGenre?: string | null }>) {
  const [genreSlug, setGenreSlug] = useState(initialGenre);

  return <GamesBrowser games={games} selectedGenreSlug={genreSlug} onSelectGenre={setGenreSlug} />;
}

describe("GamesBrowser Todos pressed state", () => {
  it("marks Todos as pressed while the catalog is unfiltered", () => {
    render(<BrowserWithGenreState />);

    expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "true");
  });

  it("moves the pressed state from Todos to the chosen genre and back", async () => {
    const user = userEvent.setup();
    render(<BrowserWithGenreState />);

    await user.click(screen.getByRole("button", { name: /Puzle/ }));

    expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Puzle/ })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Todos" }));

    expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "true");
  });
});

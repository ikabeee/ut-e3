import { render, screen, within } from "@testing-library/react";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { GameNotFoundView } from "@features/games/pages/game-not-found-page";

describe("GameNotFoundView", () => {
  it("says that the game does not exist", () => {
    render(<GameNotFoundView games={makeGames(3)} />);

    expect(screen.getByRole("heading", { level: 1, name: "Juego no encontrado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver al inicio/ })).toHaveAttribute("href", "/");
  });

  it("renders no navbar of its own: the root layout mounts the site navbar", () => {
    render(<GameNotFoundView games={[]} />);

    expect(screen.queryByRole("navigation", { name: "Principal" })).not.toBeInTheDocument();
  });

  it("shows up to five games to keep browsing and the catalog", () => {
    const games = makeGames(8);

    render(<GameNotFoundView games={games} />);

    const section = within(screen.getByRole("region", { name: "Más juegos" }));

    expect(section.getAllByRole("listitem")).toHaveLength(5);
    expect(section.getByRole("link", { name: new RegExp(games[0].name) })).toHaveAttribute(
      "href",
      `/games/${games[0].slug}`,
    );
    expect(section.getByRole("link", { name: "Ver todos" })).toHaveAttribute("href", "/games");
  });

  it("keeps the ways out of the generic 404", () => {
    render(<GameNotFoundView games={[]} />);

    expect(screen.getByRole("navigation", { name: "Sigue explorando" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Más juegos" })).not.toBeInTheDocument();
  });
});

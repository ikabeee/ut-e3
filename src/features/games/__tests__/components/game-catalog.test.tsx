import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { GameCatalog } from "@features/games/components/game-catalog";

const games = makeGames(18);

function liveRegion() {
  const region = screen.getByText(/ de 18$/).closest("[aria-live]");

  if (!region) throw new Error("The catalog needs a live region with the current game.");

  return region;
}

function cover(name: string) {
  return screen.getByAltText(`Portada de ${name}`);
}

async function press(label: string, times: number) {
  const user = userEvent.setup();

  for (let step = 0; step < times; step += 1) {
    await user.click(screen.getByRole("button", { name: label }));
  }
}

describe("GameCatalog", () => {
  it("renders the catalog heading", () => {
    render(<GameCatalog games={games} />);

    expect(screen.getByRole("heading", { level: 2, name: "Explora el catálogo" })).toBeInTheDocument();
  });

  it("renders the name and cover of every game", () => {
    render(<GameCatalog games={games} />);

    games.forEach((game) => {
      expect(cover(game.name)).toBeInTheDocument();
      expect(screen.getAllByText(game.name).length).toBeGreaterThan(0);
    });
  });

  it("starts on the middle game and announces it in the live region", () => {
    render(<GameCatalog games={games} />);

    expect(screen.getByText("09 de 18")).toBeInTheDocument();
    expect(liveRegion()).toHaveTextContent("Juego 09");
  });

  it("announces the next and previous game", async () => {
    render(<GameCatalog games={games} />);

    await press("Juego siguiente", 1);
    expect(screen.getByText("10 de 18")).toBeInTheDocument();
    expect(liveRegion()).toHaveTextContent("Juego 10");

    await press("Juego anterior", 2);
    expect(screen.getByText("08 de 18")).toBeInTheDocument();
    expect(liveRegion()).toHaveTextContent("Juego 08");
  });

  it("disables previous on the first game", async () => {
    render(<GameCatalog games={games} />);
    expect(screen.getByRole("button", { name: "Juego anterior" })).toBeEnabled();

    await press("Juego anterior", 8);

    expect(screen.getByText("01 de 18")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Juego anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Juego siguiente" })).toBeEnabled();
  });

  it("disables next on the last game", async () => {
    render(<GameCatalog games={games} />);

    await press("Juego siguiente", 9);

    expect(screen.getByText("18 de 18")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Juego siguiente" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Juego anterior" })).toBeEnabled();
  });

  it("moves to the next game with the ArrowRight key", () => {
    render(<GameCatalog games={games} />);

    fireEvent.keyDown(cover("Juego 09"), { key: "ArrowRight" });

    expect(screen.getByText("10 de 18")).toBeInTheDocument();
  });

  it("moves to the previous game with the ArrowLeft key", () => {
    render(<GameCatalog games={games} />);

    fireEvent.keyDown(cover("Juego 09"), { key: "ArrowLeft" });

    expect(screen.getByText("08 de 18")).toBeInTheDocument();
  });

  it("brings a side case to the center when it is clicked", async () => {
    const user = userEvent.setup();
    render(<GameCatalog games={games} />);

    await user.click(cover("Juego 12"));

    expect(screen.getByText("12 de 18")).toBeInTheDocument();
    expect(liveRegion()).toHaveTextContent("Juego 12");
  });

  // The coverflow opens on the middle game: Juego 09 of 18.
  it("links only the current game to its page", () => {
    render(<GameCatalog games={games} />);

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("Ver ficha de Juego 09");
    expect(links[0]).toHaveAttribute("href", "/games/juego-09");
  });

  it("points the link to the game that moves to the center", async () => {
    render(<GameCatalog games={games} />);

    await press("Juego siguiente", 1);

    expect(screen.getByRole("link", { name: "Ver ficha de Juego 10" })).toHaveAttribute("href", "/games/juego-10");
  });
});

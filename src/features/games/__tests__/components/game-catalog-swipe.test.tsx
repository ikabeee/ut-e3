import { fireEvent, render, screen } from "@testing-library/react";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { GameCatalog } from "@features/games/components/game-catalog";

const games = makeGames(18);

describe("GameCatalog swipe", () => {
  it("moves to the next game when the swipe is longer than 40 px", () => {
    render(<GameCatalog games={games} />);
    const centeredCover = screen.getByAltText("Portada de Juego 09");

    fireEvent.touchStart(centeredCover, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(centeredCover, { changedTouches: [{ clientX: 140 }] });

    expect(screen.getByText("10 de 18")).toBeInTheDocument();
  });

  it("ignores a swipe of 40 px or less", () => {
    render(<GameCatalog games={games} />);
    const centeredCover = screen.getByAltText("Portada de Juego 09");

    fireEvent.touchStart(centeredCover, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(centeredCover, { changedTouches: [{ clientX: 160 }] });

    expect(screen.getByText("09 de 18")).toBeInTheDocument();
  });
});

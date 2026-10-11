import { GAMES_COPY } from "@features/games/lib/games-copy";

describe("GAMES_COPY", () => {
  it("counts the visible games and adds the selected genre", () => {
    expect(GAMES_COPY.catalog.results(4, 18, null)).toBe("4 de 18 juegos");
    expect(GAMES_COPY.catalog.results(2, 18, "Puzle")).toBe("2 de 18 juegos · Puzle");
  });

  it("writes the number of games of a genre in singular or plural", () => {
    expect(GAMES_COPY.catalog.gameCount(1)).toBe("1 juego");
    expect(GAMES_COPY.catalog.gameCount(3)).toBe("3 juegos");
  });

  it("describes the position of the coverflow for screen readers", () => {
    expect(GAMES_COPY.coverflow.position(8, 18)).toBe("09 de 18");
  });

  it("names the players of the demo", () => {
    expect(GAMES_COPY.features.players(1)).toBe("Un jugador");
    expect(GAMES_COPY.features.players(2)).toBe("2 jugadores");
  });
});

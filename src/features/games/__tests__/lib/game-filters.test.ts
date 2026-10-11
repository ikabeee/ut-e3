import { filterGames, toggleGenre } from "@features/games/lib/game-filters";
import { MOCK_GAMES } from "@features/games/lib/mock-games";

describe("filterGames", () => {
  it("returns every game without filters", () => {
    expect(filterGames(MOCK_GAMES, { genre: null, keyword: "" })).toHaveLength(MOCK_GAMES.length);
  });

  it("keeps only the selected genre", () => {
    const games = filterGames(MOCK_GAMES, { genre: "Puzle", keyword: "" });

    expect(games.map((game) => game.name)).toEqual(["Hormigón", "Circuito 7"]);
  });

  it("searches ignoring accents and case", () => {
    expect(filterGames(MOCK_GAMES, { genre: null, keyword: "XIBALBA" }).map((game) => game.slug)).toEqual([
      "xibalba-run",
    ]);
  });

  it.each([
    ["team", "tianguis", "kaiju-mercado"],
    ["stand", "b9", "circuito-7"],
    ["description", "drones caseros", "turbina"],
  ])("searches by %s", (_field, keyword, slug) => {
    expect(filterGames(MOCK_GAMES, { genre: null, keyword }).map((game) => game.slug)).toEqual([slug]);
  });

  it("combines the genre and the keyword", () => {
    expect(filterGames(MOCK_GAMES, { genre: "Ritmo", keyword: "ciudad" }).map((game) => game.slug)).toEqual([
      "pulso-cero",
    ]);
  });
});

describe("toggleGenre", () => {
  it("selects a genre", () => {
    expect(toggleGenre(null, "Ritmo")).toBe("Ritmo");
  });

  it("replaces the selected genre", () => {
    expect(toggleGenre("Puzle", "Ritmo")).toBe("Ritmo");
  });

  it("clears the genre when it is selected again", () => {
    expect(toggleGenre("Ritmo", "Ritmo")).toBeNull();
  });
});

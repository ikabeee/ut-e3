import { filterGames, toggleGenre } from "@features/games/lib/game-filters";
import { GAME_FIXTURES } from "@features/games/lib/game-fixtures";

describe("filterGames", () => {
  it("returns every game without filters", () => {
    expect(filterGames(GAME_FIXTURES, { genre: null, keyword: "" })).toHaveLength(GAME_FIXTURES.length);
  });

  it("keeps only the selected genre", () => {
    const games = filterGames(GAME_FIXTURES, { genre: "Puzle", keyword: "" });

    expect(games.map((game) => game.name)).toEqual(["Hormigón", "Circuito 7"]);
  });

  it("searches ignoring accents and case", () => {
    expect(filterGames(GAME_FIXTURES, { genre: null, keyword: "XIBALBA" }).map((game) => game.slug)).toEqual([
      "xibalba-run",
    ]);
  });

  it.each([
    ["team", "voltio", "circuito-7"],
    ["stand", "b9", "circuito-7"],
    ["description", "drones caseros", "turbina"],
  ])("searches by %s", (_field, keyword, slug) => {
    expect(filterGames(GAME_FIXTURES, { genre: null, keyword }).map((game) => game.slug)).toEqual([slug]);
  });

  it("combines the genre and the keyword", () => {
    expect(filterGames(GAME_FIXTURES, { genre: "Ritmo", keyword: "ciudad" }).map((game) => game.slug)).toEqual([
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

import { makeGame, makeGames } from "@features/games/__tests__/components/game-test-data";
import { filterGames, toggleGenre } from "@features/games/lib/game-filters";

const games = makeGames(6);

function namesOf(list: { name: string }[]) {
  return list.map((game) => game.name);
}

describe("filterGames", () => {
  it("returns every game when there is no genre and no keyword", () => {
    expect(filterGames(games, { genreSlug: null, keyword: "" })).toEqual(games);
  });

  it("keeps only the games of the selected genre", () => {
    expect(namesOf(filterGames(games, { genreSlug: "puzzle", keyword: "" }))).toEqual(["Juego 02", "Juego 05"]);
  });

  it("matches the keyword in the name, genre, stand code and synopsis, ignoring accents and case", () => {
    const catalog = [
      makeGame({ id: "cenote", name: "Cenote" }),
      makeGame({
        id: "ruta-9",
        name: "Ruta 9",
        synopsis: "Carreras en la península.",
        stand: { zone: "B", number: 4 },
      }),
    ];

    expect(namesOf(filterGames(catalog, { genreSlug: null, keyword: "  CÉNOTE " }))).toEqual(["Cenote"]);
    expect(namesOf(filterGames(catalog, { genreSlug: null, keyword: "peninsula" }))).toEqual(["Ruta 9"]);
    expect(namesOf(filterGames(catalog, { genreSlug: null, keyword: "zb-s4" }))).toEqual(["Ruta 9"]);
    expect(namesOf(filterGames(catalog, { genreSlug: null, keyword: "accion" }))).toEqual(["Cenote", "Ruta 9"]);
  });

  it("applies the genre and the keyword together", () => {
    expect(namesOf(filterGames(games, { genreSlug: "puzzle", keyword: "05" }))).toEqual(["Juego 05"]);
    expect(filterGames(games, { genreSlug: "racing", keyword: "05" })).toEqual([]);
  });
});

describe("toggleGenre", () => {
  it("selects a genre, replaces it with another one and clears it when selected again", () => {
    expect(toggleGenre(null, "puzzle")).toBe("puzzle");
    expect(toggleGenre("puzzle", "action")).toBe("action");
    expect(toggleGenre("puzzle", "puzzle")).toBeNull();
  });
});

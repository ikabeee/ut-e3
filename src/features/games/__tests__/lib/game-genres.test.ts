import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { findGenre, summarizeGenres } from "@features/games/lib/game-genres";

describe("summarizeGenres", () => {
  it("orders the genres by game count and then alphabetically", () => {
    const summaries = summarizeGenres(makeGames(7));

    expect(summaries.map(({ genre, gameCount }) => [genre.name, gameCount])).toEqual([
      ["Acción", 3],
      ["Carreras", 2],
      ["Puzle", 2],
    ]);
  });

  it("gives each genre three covers of its own games, the first game in front", () => {
    const [action] = summarizeGenres(makeGames(7));

    expect(action.covers.map((game) => game.name)).toEqual(["Juego 04", "Juego 07", "Juego 01"]);
  });

  it("repeats the covers of a genre with fewer than three games", () => {
    const summaries = summarizeGenres(makeGames(1));

    expect(summaries[0].covers.map((game) => game.name)).toEqual(["Juego 01", "Juego 01", "Juego 01"]);
  });
});

describe("findGenre", () => {
  const games = makeGames(3);

  it("finds a genre of the catalog by its slug", () => {
    expect(findGenre(games, "racing")).toEqual({ id: "racing", name: "Carreras", slug: "racing" });
  });

  it("returns null for a missing or unknown slug", () => {
    expect(findGenre(games, null)).toBeNull();
    expect(findGenre(games, "horror")).toBeNull();
  });
});

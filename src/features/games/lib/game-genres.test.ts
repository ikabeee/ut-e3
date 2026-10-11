import { isKnownGenre, summarizeGenres } from "@features/games/lib/game-genres";
import { GAME_FIXTURES } from "@features/games/lib/game-fixtures";

describe("summarizeGenres", () => {
  const genres = summarizeGenres(GAME_FIXTURES);

  it("lists the genres with more games first and then alphabetically", () => {
    expect(genres.map((genre) => genre.name)).toEqual([
      "Aventura",
      "Carreras",
      "Puzle",
      "Ritmo",
      "Acción",
      "Pelea",
      "Plataformas",
    ]);
  });

  it("counts the games of each genre", () => {
    expect(genres.find((genre) => genre.name === "Carreras")?.gameCount).toBe(2);
    expect(genres.find((genre) => genre.name === "Pelea")?.gameCount).toBe(1);
  });

  it("puts the first game of the genre at the front of the stack", () => {
    const racing = genres.find((genre) => genre.name === "Carreras");

    expect(racing?.covers.map((game) => game.slug)).toEqual(["turbina", "ruta-9", "ruta-9"]);
  });

  it("repeats the only game of a genre in the three covers", () => {
    const fighting = genres.find((genre) => genre.name === "Pelea");

    expect(fighting?.covers.map((game) => game.slug)).toEqual(["lucha-pixel", "lucha-pixel", "lucha-pixel"]);
  });
});

describe("isKnownGenre", () => {
  it("accepts genres that exist in the catalog", () => {
    expect(isKnownGenre(GAME_FIXTURES, "Pelea")).toBe(true);
  });

  it("rejects unknown or empty genres", () => {
    expect(isKnownGenre(GAME_FIXTURES, "Deportes")).toBe(false);
    expect(isKnownGenre(GAME_FIXTURES, null)).toBe(false);
  });
});

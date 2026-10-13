import type { Game, GenreSummary } from "@features/games/lib/types";

/** Más juegos primero; a igual cantidad, en orden alfabético. */
function compareGenres(a: GenreSummary, b: GenreSummary) {
  if (a.gameCount !== b.gameCount) {
    return b.gameCount - a.gameCount;
  }

  return a.name.localeCompare(b.name, "es");
}

/**
 * Géneros para el carrusel: primero los que tienen más juegos y, a igual cantidad,
 * en orden alfabético. Cada uno lleva tres portadas (dos al fondo y una al frente).
 */
export function summarizeGenres(games: readonly Game[]): GenreSummary[] {
  const gamesByGenre = new Map<string, Game[]>();

  // Se agrega al arreglo del género sin copiarlo: un solo recorrido, O(n).
  for (const game of games) {
    const genreGames = gamesByGenre.get(game.genre);

    if (genreGames) {
      genreGames.push(game);
    } else {
      gamesByGenre.set(game.genre, [game]);
    }
  }

  const summaries = [...gamesByGenre.entries()].map(([name, genreGames]) => ({
    name,
    gameCount: genreGames.length,
    covers: [1, 2, 0].map((index) => genreGames[index % genreGames.length]),
  }));

  return summaries.sort(compareGenres);
}

export function isKnownGenre(games: readonly Game[], genre: string | null): genre is string {
  return genre !== null && games.some((game) => game.genre === genre);
}

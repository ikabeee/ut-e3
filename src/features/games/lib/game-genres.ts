import type { Game, GenreSummary } from "@features/games/lib/types";

/**
 * Géneros para el carrusel: primero los que tienen más juegos y, a igual cantidad,
 * en orden alfabético. Cada uno lleva tres portadas (dos al fondo y una al frente).
 */
export function summarizeGenres(games: readonly Game[]): GenreSummary[] {
  const gamesByGenre = new Map<string, Game[]>();
  for (const game of games) {
    gamesByGenre.set(game.genre, [...(gamesByGenre.get(game.genre) ?? []), game]);
  }

  return [...gamesByGenre.entries()]
    .map(([name, genreGames]) => ({
      name,
      gameCount: genreGames.length,
      covers: [1, 2, 0].map((index) => genreGames[index % genreGames.length]),
    }))
    .sort((a, b) => b.gameCount - a.gameCount || a.name.localeCompare(b.name, "es"));
}

export function isKnownGenre(games: readonly Game[], genre: string | null): genre is string {
  return genre !== null && games.some((game) => game.genre === genre);
}

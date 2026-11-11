import type { Game, Genre, GenreSummary } from "@features/games/lib/types";

// Two covers at the back and the genre's first game in front, so the front slot comes last.
const COVER_ORDER = [1, 2, 0];

export function summarizeGenres(games: readonly Game[]): GenreSummary[] {
  return [...groupByGenre(games).values()].map(toSummary).toSorted(compareSummaries);
}

export function findGenre(games: readonly Game[], slug: string | null): Genre | null {
  return games.find((game) => game.genre.slug === slug)?.genre ?? null;
}

function groupByGenre(games: readonly Game[]): Map<string, Game[]> {
  const groups = new Map<string, Game[]>();

  for (const game of games) {
    groups.set(game.genre.slug, [...(groups.get(game.genre.slug) ?? []), game]);
  }

  return groups;
}

function toSummary(genreGames: Game[]): GenreSummary {
  return {
    genre: genreGames[0].genre,
    gameCount: genreGames.length,
    covers: COVER_ORDER.map((index) => genreGames[index % genreGames.length]),
  };
}

function compareSummaries(first: GenreSummary, second: GenreSummary): number {
  return second.gameCount - first.gameCount || first.genre.name.localeCompare(second.genre.name, "es");
}

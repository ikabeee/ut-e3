import type { Game } from "@features/games/lib/types";

export const RELATED_GAMES_LIMIT = 5;

interface CatalogEntry {
  game: Game;
  distance: number;
}

// "Más juegos": the same genre first, then the games that follow the current one in catalog order (wrapping around).
export function getRelatedGames(games: readonly Game[], current: Game, limit = RELATED_GAMES_LIMIT): Game[] {
  const currentIndex = games.findIndex((game) => game.slug === current.slug);
  const isSameGenre = (game: Game) => game.genre.slug === current.genre.slug;

  return games
    .flatMap((game, index) =>
      game.slug === current.slug ? [] : [{ game, distance: (index - currentIndex + games.length) % games.length }],
    )
    .toSorted((first, second) => compareEntries(first, second, isSameGenre))
    .slice(0, limit)
    .map(({ game }) => game);
}

function compareEntries(first: CatalogEntry, second: CatalogEntry, isSameGenre: (game: Game) => boolean): number {
  return Number(isSameGenre(second.game)) - Number(isSameGenre(first.game)) || first.distance - second.distance;
}

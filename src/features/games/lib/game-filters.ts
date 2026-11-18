import { searchGames, type GameSearchFields } from "@features/games/lib/game-search";
import { formatStandCode } from "@features/games/lib/stand-code";
import type { Game } from "@features/games/lib/types";

export interface GameFilters {
  /** `null` shows every genre. */
  genreSlug: string | null;
  keyword: string;
}

/** The catalog uses the search of the navbar (S21), so /games?q= shows what the suggestions showed. */
export function filterGames(games: readonly Game[], { genreSlug, keyword }: GameFilters): Game[] {
  return searchGames(games, keyword, toSearchFields).filter(
    (game) => genreSlug === null || game.genre.slug === genreSlug,
  );
}

// Selecting the active genre clears it; selecting another one replaces it.
export function toggleGenre(current: string | null, genreSlug: string): string | null {
  return current === genreSlug ? null : genreSlug;
}

function toSearchFields(game: Game): GameSearchFields {
  return {
    name: game.name,
    slug: game.slug,
    genreName: game.genre.name,
    extraText: `${formatStandCode(game.stand)} ${game.synopsis}`,
  };
}

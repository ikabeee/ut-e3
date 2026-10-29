import { formatStandCode } from "@features/games/lib/stand-code";
import type { Game } from "@features/games/lib/types";

export interface GameFilters {
  /** `null` shows every genre. */
  genreSlug: string | null;
  keyword: string;
}

export function filterGames(games: readonly Game[], { genreSlug, keyword }: GameFilters): Game[] {
  const query = normalizeText(keyword.trim());

  return games.filter(
    (game) => (genreSlug === null || game.genre.slug === genreSlug) && searchableText(game).includes(query),
  );
}

// Selecting the active genre clears it; selecting another one replaces it.
export function toggleGenre(current: string | null, genreSlug: string): string | null {
  return current === genreSlug ? null : genreSlug;
}

function searchableText(game: Game): string {
  return normalizeText(`${game.name} ${game.genre.name} ${formatStandCode(game.stand)} ${game.synopsis}`);
}

// "Acción" and "accion" match: NFD splits each accent into a combining mark, which the regex removes.
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

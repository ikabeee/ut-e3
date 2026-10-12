import type { Game } from "@features/games/lib/types";
import { normalizeText } from "@shared/lib/text";

export interface GameFilters {
  /** Género seleccionado en el carrusel; `null` muestra todos. */
  genre: string | null;
  /** Texto del buscador. */
  keyword: string;
}

export const EMPTY_GAME_FILTERS: GameFilters = { genre: null, keyword: "" };

/** Texto en el que busca el buscador: nombre, equipo, género, stand y descripción. */
function searchableText(game: Game) {
  return normalizeText(`${game.name} ${game.team} ${game.genre} ${game.stand ?? ""} ${game.description}`);
}

/** Aplica el género y el texto de búsqueda (sin distinguir acentos ni mayúsculas). */
export function filterGames(games: readonly Game[], { genre, keyword }: GameFilters) {
  const query = normalizeText(keyword.trim());

  return games.filter(
    (game) => (genre === null || game.genre === genre) && (query === "" || searchableText(game).includes(query)),
  );
}

/** Seleccionar el género activo lo quita; seleccionar otro lo reemplaza. */
export function toggleGenre(current: string | null, genre: string) {
  return current === genre ? null : genre;
}

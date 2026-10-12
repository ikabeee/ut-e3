import { getPlanItemPath } from "@features/floor-plan/lib/floor-plan-links";

/** Ruta del catálogo de juegos. */
export const GAMES_PATH = "/games";

/** Nombre del parámetro de la URL del catálogo que guarda el género: `/games?genre=Puzle`. */
export const GENRE_SEARCH_PARAM = "genre";

export function getGamePath(slug: string) {
  return `${GAMES_PATH}/${slug}`;
}

export function getGenreCatalogPath(genre: string) {
  return `${GAMES_PATH}?${GENRE_SEARCH_PARAM}=${encodeURIComponent(genre)}`;
}

/** Stand del juego en el croquis interactivo: `/floor-plan#A1`. */
export function getStandMapPath(stand: string) {
  return getPlanItemPath(stand);
}

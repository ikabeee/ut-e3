import { routes } from "@shared/lib/site-config";

/** Nombre del parámetro de la URL del catálogo que guarda el género: `/games?genre=Puzle`. */
export const GENRE_SEARCH_PARAM = "genre";

export function getGamePath(slug: string) {
  return `${routes.games}/${slug}`;
}

export function getGenreCatalogPath(genre: string) {
  return `${routes.games}?${GENRE_SEARCH_PARAM}=${encodeURIComponent(genre)}`;
}

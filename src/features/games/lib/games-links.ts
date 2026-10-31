export const GAMES_SECTION_ID = "games";

export const GAMES_PATH = "/games";

export const GENRE_SEARCH_PARAM = "genre";

export function getGamePath(slug: string): string {
  return `${GAMES_PATH}/${slug}`;
}

export function getGenrePath(genreSlug: string): string {
  return `${GAMES_PATH}?${new URLSearchParams({ [GENRE_SEARCH_PARAM]: genreSlug })}`;
}

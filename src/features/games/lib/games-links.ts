export const GAMES_SECTION_ID = "games";

export const GAMES_PATH = "/games";

export const GENRE_SEARCH_PARAM = "genre";

export function getGamePath(slug: string): string {
  return `${GAMES_PATH}/${slug}`;
}

export function getGenrePath(genreSlug: string): string {
  return `${GAMES_PATH}?${new URLSearchParams({ [GENRE_SEARCH_PARAM]: genreSlug })}`;
}

// The stand administrator registers the game of its stand here (RF-31); the page belongs to this feature.
export const STAND_GAME_PATH = "/stand/game";

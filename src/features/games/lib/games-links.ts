export const GAMES_SECTION_ID = "games";

export const GAMES_PATH = "/games";

export const GENRE_SEARCH_PARAM = "genre";

// The site navbar submits its search as GET /games?q=<text>; the catalog filters its covers by it.
export const KEYWORD_SEARCH_PARAM = "q";

export function getGamePath(slug: string): string {
  return `${GAMES_PATH}/${slug}`;
}

export function getGenrePath(genreSlug: string): string {
  return `${GAMES_PATH}?${new URLSearchParams({ [GENRE_SEARCH_PARAM]: genreSlug })}`;
}

// The stand administrator registers the game of its stand here (RF-31); the page belongs to this feature.
export const STAND_GAME_PATH = "/stand/game";

// The itch.io link of a game is decided by the clock of the server (RF-10) and read from here, never from the page.
export function getItchApiPath(slug: string): string {
  return `/api/games/${slug}/itch`;
}

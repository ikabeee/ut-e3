export const GAMES_SECTION_ID = "games";

export function getGamePath(slug: string): string {
  return `/games/${slug}`;
}

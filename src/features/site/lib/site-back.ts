import { GAMES_PATH } from "@features/games/lib/games-links";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { isSiteNavShown } from "@features/site/lib/site-navigation";

/** Whether the navbar shows the Volver control: every public page except the landing, never in landing-only mode. */
export function isBackShown(pathname: string, isLandingOnly = false): boolean {
  return !isLandingOnly && pathname !== HOME_PATH && isSiteNavShown(pathname);
}

/** Where Volver lands without same-site history: the catalog from a game page, the landing from anywhere else. */
export function getBackFallbackPath(pathname: string): string {
  return isGamePage(pathname) ? GAMES_PATH : HOME_PATH;
}

function isGamePage(pathname: string): boolean {
  return pathname.startsWith(`${GAMES_PATH}/`);
}

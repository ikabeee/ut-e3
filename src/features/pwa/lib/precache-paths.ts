import { GAMES_PATH, getGamePath } from "@features/games/lib/games-links";
import { OFFLINE_PATH } from "@features/pwa/lib/pwa-links";
import { PRIVACY_PATH } from "@features/visitors/lib/visitors-links";

const HOME_PATH = "/";

const SPONSORS_PATH = "/sponsors";

/** The public pages the phone saves ahead of time (RNF-14): the landing with the floor plan, the catalog and each game. */
export function buildPrecachePaths(gameSlugs: readonly string[]): string[] {
  return [HOME_PATH, GAMES_PATH, SPONSORS_PATH, PRIVACY_PATH, OFFLINE_PATH, ...gameSlugs.map(getGamePath)];
}

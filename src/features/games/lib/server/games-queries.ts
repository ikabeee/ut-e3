import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { INITIAL_GAMES } from "@features/games/lib/server/games-seed";
import type { Game } from "@features/games/lib/types";

export const GAMES_CACHE_TAG = "games";

export async function getGames(): Promise<Game[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(GAMES_CACHE_TAG);

  return INITIAL_GAMES.toSorted(compareByStand);
}

function compareByStand(first: Game, second: Game): number {
  return first.stand.zone.localeCompare(second.stand.zone) || first.stand.number - second.stand.number;
}

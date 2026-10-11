import { useSuspenseQuery } from "@tanstack/react-query";
import { gamesQueryOptions } from "@features/games/lib/games-query-options";

/**
 * Juegos desde la caché de TanStack Query. La page los prellena en el servidor
 * (`getGamesHydrationState`), así que el primer render ya tiene datos.
 */
export function useGames() {
  return useSuspenseQuery(gamesQueryOptions()).data;
}

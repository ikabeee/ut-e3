import "server-only";
import { GAMES_CACHE_TAG, listGames } from "@features/games/lib/games-queries";
import { gamesQueryKeys } from "@features/games/lib/games-query-options";
import { dehydrateForPrerender } from "@shared/lib/query/dehydrate-for-prerender";

/**
 * Estado de TanStack Query con la lista de juegos, prellenado en el servidor.
 * Las pages lo pasan a `QueryHydrationBoundary`; así `useGames()` tiene datos desde el
 * primer render, sin esperar a `/api/games`.
 */
export async function getGamesHydrationState() {
  const games = await listGames();
  return dehydrateForPrerender([{ queryKey: gamesQueryKeys.list(), data: games }], [GAMES_CACHE_TAG]);
}

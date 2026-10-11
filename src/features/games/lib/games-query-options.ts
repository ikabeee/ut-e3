import { queryOptions } from "@tanstack/react-query";
import { fetchGames } from "@features/games/api/games-api-client";

export const gamesQueryKeys = {
  all: ["games"] as const,
  list: () => [...gamesQueryKeys.all, "list"] as const,
};

/**
 * Lista de juegos para `useSuspenseQuery`. Las pages la prellenan en el servidor con
 * `getGamesHydrationState` (lib/server/games-prefetch.ts).
 *
 * `staleTime: "static"`: la fuente de verdad es la caché de Next.js (etiqueta `games`).
 * Cuando esa caché se invalida, la siguiente navegación hidrata datos más nuevos y TanStack
 * los reemplaza. Además, así el catálogo se prerenderiza completo: con un `staleTime`
 * numérico TanStack lee `Date.now()` al renderizar y Next.js lo mandaría al cliente.
 * Tras una mutación usa `queryClient.invalidateQueries({ queryKey: gamesQueryKeys.all })`.
 */
export function gamesQueryOptions() {
  return queryOptions({
    queryKey: gamesQueryKeys.list(),
    queryFn: fetchGames,
    staleTime: "static",
  });
}

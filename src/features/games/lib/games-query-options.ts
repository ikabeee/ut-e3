import { queryOptions } from "@tanstack/react-query";
import type { Game } from "@features/games/lib/types";

/** Endpoint público de los juegos (src/app/api/games/route.ts). */
export const GAMES_API_PATH = "/api/games";

export const gamesQueryKeys = {
  all: ["games"] as const,
  list: () => [...gamesQueryKeys.all, "list"] as const,
};

/** Lee los juegos desde el Route Handler. Se ejecuta en el navegador. */
export async function fetchGames(): Promise<Game[]> {
  const response = await fetch(GAMES_API_PATH);
  if (!response.ok) {
    throw new Error(`No se pudieron cargar los juegos (${response.status}).`);
  }
  return response.json() as Promise<Game[]>;
}

/**
 * Lista de juegos para `useSuspenseQuery`. Las pages la prellenan en el servidor con
 * `getGamesHydrationState` (lib/games-prefetch.ts).
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

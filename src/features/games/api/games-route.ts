import "server-only";
import { toGameDto } from "@features/games/api/games-contract";
import type { listGames } from "@features/games/lib/server/games-queries";

const defaultListGames: typeof listGames = async () =>
  (await import("@features/games/lib/server/games-queries")).listGames();

/**
 * `GET /api/games`: lista de juegos para TanStack Query en el navegador (`fetchGames`).
 * `src/app/api/games/route.ts` sólo re-exporta este handler.
 *
 * `listGames()` usa `"use cache"` + `cacheLife("hours")`, así que Next.js prerenderiza la
 * respuesta y fija su `Cache-Control` (`s-maxage`) según ese `cacheLife`; por eso no se define a
 * mano. Los errores tampoco se atrapan: en el build detienen el prerender y, al revalidar,
 * Next.js sigue sirviendo la última respuesta buena en lugar de guardar un error.
 */
export function createGamesRoute(fetchGames: typeof listGames = defaultListGames) {
  return async function GET() {
    const games = await fetchGames();

    return Response.json(games.map(toGameDto));
  };
}

export const GET = createGamesRoute();

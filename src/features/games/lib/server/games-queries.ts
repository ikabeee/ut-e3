import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { GameRepository } from "@features/games/lib/game-repository";
import { getGameRepository } from "@features/games/lib/server/game-repositories";

/** Etiqueta de caché de los juegos: invalídala con `updateTag(GAMES_CACHE_TAG)` tras una mutación. */
export const GAMES_CACHE_TAG = "games";

// Las consultas se cachean con "use cache": las páginas se prerenderizan (SEO y rendimiento)
// y siguen funcionando igual con Prisma, que no permite prerenderizar consultas sin caché.
// El repositorio se resuelve dentro de la caché; las pruebas ejercitan la misma consulta con una
// implementación de GameRepository inyectada en createGameQueries.

export function createGameQueries(getRepository: () => GameRepository) {
  return {
    listGames: () => getRepository().listGames(),
    getGameBySlug: (slug: string) => getRepository().findGameBySlug(slug),
  };
}

export async function listGames() {
  "use cache";
  cacheLife("hours");
  cacheTag(GAMES_CACHE_TAG);

  return createGameQueries(getGameRepository).listGames();
}

export async function getGameBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(GAMES_CACHE_TAG);

  return createGameQueries(getGameRepository).getGameBySlug(slug);
}

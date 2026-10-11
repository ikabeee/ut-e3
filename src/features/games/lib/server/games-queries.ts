import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getGameRepository } from "@features/games/lib/server/game-repositories";

/** Etiqueta de caché de los juegos: invalídala con `updateTag(GAMES_CACHE_TAG)` tras una mutación. */
export const GAMES_CACHE_TAG = "games";

// Las consultas se cachean con "use cache": las páginas se prerenderizan (SEO y rendimiento)
// y siguen funcionando igual con Prisma, que no permite prerenderizar consultas sin caché.
// No reciben el repositorio por parámetro porque los argumentos de "use cache" deben ser
// serializables: la fuente se elige en `getGameRepository()` (`DATA_SOURCE`) y las pruebas la
// sustituyen con `jest.mock`.

export async function listGames() {
  "use cache";
  cacheLife("hours");
  cacheTag(GAMES_CACHE_TAG);

  return getGameRepository().listGames();
}

export async function getGameBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(GAMES_CACHE_TAG);

  return getGameRepository().findGameBySlug(slug);
}

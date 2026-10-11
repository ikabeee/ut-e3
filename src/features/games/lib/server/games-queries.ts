import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { GameRepository } from "@features/games/lib/game-repository";
import { mockGameRepository } from "@features/games/lib/mock-game-repository";

/**
 * Fuente de datos activa. Para usar la base de datos, crea `prisma-game-repository.ts`
 * (implementa `GameRepository` con `db.orm.public.Game`) y cámbiala aquí.
 */
const gameRepository: GameRepository = mockGameRepository;

/** Etiqueta de caché de los juegos: invalídala con `updateTag(GAMES_CACHE_TAG)` tras una mutación. */
export const GAMES_CACHE_TAG = "games";

// Las consultas se cachean con "use cache": las páginas se prerenderizan (SEO y rendimiento)
// y siguen funcionando igual con Prisma, que no permite prerenderizar consultas sin caché.

export async function listGames() {
  "use cache";
  cacheLife("hours");
  cacheTag(GAMES_CACHE_TAG);

  return gameRepository.listGames();
}

export async function getGameBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(GAMES_CACHE_TAG);

  return gameRepository.findGameBySlug(slug);
}

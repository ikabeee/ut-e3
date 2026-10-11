import "server-only";
import type { GameRepository } from "@features/games/lib/game-repository";
import { mockGameRepository } from "@features/games/lib/mock/mock-game-repository";
import { env, type DataSource } from "@shared/lib/env";

/**
 * Implementaciones de `GameRepository` por fuente de datos. Cuando exista
 * `lib/server/prisma-game-repository.ts`, agrégalo aquí (`prisma: prismaGameRepository`) y
 * actívalo con `DATA_SOURCE=prisma`, sin tocar `games-queries.ts`.
 */
const GAME_REPOSITORIES: Partial<Record<DataSource, GameRepository>> = {
  mock: mockGameRepository,
};

/**
 * Composition root de los juegos: elige el repositorio según `DATA_SOURCE` (validado en
 * `@shared/lib/env`). Si la fuente todavía no tiene implementación, lanza un error y el build se
 * detiene en lugar de publicar un sitio sin juegos.
 */
export function getGameRepository(dataSource: DataSource = env.dataSource): GameRepository {
  const repository = GAME_REPOSITORIES[dataSource];
  if (!repository) {
    throw new Error(
      `DATA_SOURCE="${dataSource}" todavía no tiene repositorio de juegos. Créalo en lib/server/ y regístralo en game-repositories.ts (ver docs/data-sources.md).`,
    );
  }
  return repository;
}

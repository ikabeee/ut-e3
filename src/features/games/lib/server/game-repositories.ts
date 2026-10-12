import "server-only";
import type { GameRepository } from "@features/games/lib/game-repository";
import { mockGameRepository } from "@features/games/lib/mock/mock-game-repository";
import { prismaGameRepository } from "@features/games/lib/server/prisma-game-repository";
import { env, type DataSource } from "@shared/lib/env";

/**
 * Implementaciones de `GameRepository` por fuente de datos: los juegos del diseño (`mock`) o
 * PostgreSQL (`prisma`). Se eligen con `DATA_SOURCE` sin tocar `games-queries.ts`.
 */
const GAME_REPOSITORIES: Partial<Record<DataSource, GameRepository>> = {
  mock: mockGameRepository,
  prisma: prismaGameRepository,
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

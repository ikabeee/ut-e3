import type { Game } from "@features/games/lib/types";
import type { DataSource } from "@shared/lib/env";

/**
 * Contrato de acceso a los juegos.
 *
 * `server/games-queries.ts` depende de esta interfaz y no de una fuente concreta, así que
 * cambiar los datos mock por Prisma (u otra API) sólo requiere una implementación nueva.
 */
export interface GameRepository {
  /** Todos los juegos en el orden en que se presentan. */
  listGames(): Promise<Game[]>;
  findGameBySlug(slug: string): Promise<Game | null>;
}

/** Elige una implementación disponible para la fuente configurada. */
export function selectGameRepository(
  dataSource: DataSource,
  repositories: Partial<Record<DataSource, GameRepository>>,
): GameRepository {
  const repository = repositories[dataSource];

  if (!repository) {
    throw new Error(
      `DATA_SOURCE="${dataSource}" todavía no tiene repositorio de juegos. Créalo en lib/server/ y regístralo en game-repositories.ts (ver docs/data-sources.md).`,
    );
  }

  return repository;
}

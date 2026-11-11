import type { Game } from "@features/games/lib/types";

/**
 * Contrato de acceso a los juegos.
 *
 * `games-queries.ts` depende de esta interfaz y no de una fuente concreta, así que cambiar
 * los datos mock por Prisma (u otra API) sólo requiere una implementación nueva.
 */
export interface GameRepository {
  /** Todos los juegos en el orden en que se presentan. */
  listGames(): Promise<Game[]>;
  findGameBySlug(slug: string): Promise<Game | null>;
}

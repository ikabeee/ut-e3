import type { Game } from "@features/games/lib/types";

/**
 * Contrato de acceso a los juegos.
 *
 * `server/games-queries.ts` depende de esta interfaz y no directamente de Prisma, permitiendo
 * inyectar un repositorio falso en las pruebas unitarias sin depender de la base de datos.
 */
export interface GameRepository {
  /** Todos los juegos en el orden en que se presentan. */
  listGames(): Promise<Game[]>;
  findGameBySlug(slug: string): Promise<Game | null>;
}

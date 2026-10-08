import type { Game } from "./game";

/**
 * Puerto de persistencia del módulo. La capa de aplicación depende de esta
 * interfaz, nunca de Prisma directamente.
 */
export interface GameRepository {
  listPublished(): Promise<Game[]>;
  findPublishedBySlug(slug: string): Promise<Game | null>;
}

import "server-only";
import type { GameRepository } from "@features/games/lib/game-repository";
import { prismaGameRepository } from "@features/games/lib/server/prisma-game-repository";

/**
 * Composition root de los juegos: devuelve el repositorio conectado a PostgreSQL (Prisma).
 */
export function getGameRepository(): GameRepository {
  return prismaGameRepository;
}

import type { GameRepository } from "@features/games/lib/game-repository";
import { MOCK_GAMES } from "@features/games/lib/mock-games";

/** Implementación en memoria con los juegos del diseño. Se elimina al conectar Prisma. */
export const mockGameRepository: GameRepository = {
  async listGames() {
    return [...MOCK_GAMES];
  },

  async findGameBySlug(slug) {
    return MOCK_GAMES.find((game) => game.slug === slug) ?? null;
  },
};

import type { GameRepository } from "@features/games/lib/game-repository";
import { MOCK_GAMES } from "@features/games/lib/mock/mock-games";

/**
 * TEMPORAL: implementación en memoria con los juegos del diseño (`DATA_SOURCE=mock`). Se elimina,
 * con toda la carpeta `lib/mock/`, cuando los juegos vengan de Prisma.
 */
export const mockGameRepository: GameRepository = {
  async listGames() {
    return [...MOCK_GAMES];
  },

  async findGameBySlug(slug) {
    return MOCK_GAMES.find((game) => game.slug === slug) ?? null;
  },
};

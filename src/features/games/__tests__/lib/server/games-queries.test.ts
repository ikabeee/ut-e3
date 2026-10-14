/**
 * @jest-environment node
 */
import type { GameRepository } from "@features/games/lib/game-repository";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";
import { createGameQueries, GAMES_CACHE_TAG } from "@features/games/lib/server/games-queries";

// Repositorio falso: las consultas se prueban sin mocks del sitio, sin red y sin base de datos.
const fakeRepository: GameRepository = {
  listGames: async () => [...GAME_FIXTURES],
  findGameBySlug: async (slug) => GAME_FIXTURES.find((game) => game.slug === slug) ?? null,
};

describe("games queries", () => {
  const queries = createGameQueries(() => fakeRepository);

  it("defines the cache tag for games", () => {
    expect(GAMES_CACHE_TAG).toBe("games");
  });

  it("lists the games of the active repository", async () => {
    await expect(queries.listGames()).resolves.toEqual(GAME_FIXTURES);
  });

  it("finds a game by slug or returns null", async () => {
    await expect(queries.getGameBySlug("ruta-9")).resolves.toMatchObject({ name: "Ruta 9", stand: "A4" });
    await expect(queries.getGameBySlug("missing-game")).resolves.toBeNull();
  });
});

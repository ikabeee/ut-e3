import { cacheTag } from "next/cache";
import type { GameRepository } from "@features/games/lib/game-repository";
import { GAME_FIXTURES } from "@features/games/lib/game-fixtures";
import { GAMES_CACHE_TAG, getGameBySlug, listGames } from "@features/games/lib/server/games-queries";

// Repositorio falso: las consultas se prueban sin mocks del sitio, sin red y sin base de datos.
const fakeRepository: GameRepository = {
  listGames: async () => [...GAME_FIXTURES],
  findGameBySlug: async (slug) => GAME_FIXTURES.find((game) => game.slug === slug) ?? null,
};

jest.mock("@features/games/lib/server/game-repositories", () => ({
  getGameRepository: () => fakeRepository,
}));

// Fuera de Next.js no hay caché: `cacheLife` y `cacheTag` sólo se registran.
jest.mock("next/cache", () => ({ cacheLife: jest.fn(), cacheTag: jest.fn() }));

describe("games queries", () => {
  it("lists the games of the active repository", async () => {
    await expect(listGames()).resolves.toEqual(GAME_FIXTURES);
    expect(cacheTag).toHaveBeenCalledWith(GAMES_CACHE_TAG);
  });

  it("finds a game by slug or returns null", async () => {
    await expect(getGameBySlug("ruta-9")).resolves.toMatchObject({ name: "Ruta 9", stand: "A4" });
    await expect(getGameBySlug("missing-game")).resolves.toBeNull();
  });
});

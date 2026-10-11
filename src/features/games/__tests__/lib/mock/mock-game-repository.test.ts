import { mockGameRepository } from "@features/games/lib/mock/mock-game-repository";
import { MOCK_GAMES } from "@features/games/lib/mock/mock-games";

// Revisa los datos que hoy muestra el sitio; las pruebas de la lógica usan `__tests__/game-fixtures.ts`.
describe("mockGameRepository", () => {
  it("lists every game of the mock catalog", async () => {
    await expect(mockGameRepository.listGames()).resolves.toEqual(MOCK_GAMES);
  });

  it("returns a copy so callers cannot mutate the mock data", async () => {
    const games = await mockGameRepository.listGames();
    games.pop();

    await expect(mockGameRepository.listGames()).resolves.toHaveLength(MOCK_GAMES.length);
  });

  it("finds a game by slug", async () => {
    await expect(mockGameRepository.findGameBySlug("lucha-pixel")).resolves.toMatchObject({
      name: "Lucha Pixel",
      stand: "B7",
    });
  });

  it("returns null for an unknown slug", async () => {
    await expect(mockGameRepository.findGameBySlug("missing-game")).resolves.toBeNull();
  });

  it("uses unique slugs and stands", async () => {
    const games = await mockGameRepository.listGames();

    expect(new Set(games.map((game) => game.slug)).size).toBe(games.length);
    expect(new Set(games.map((game) => game.stand)).size).toBe(games.length);
  });
});

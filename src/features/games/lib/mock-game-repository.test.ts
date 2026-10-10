import { mockGameRepository } from "@features/games/lib/mock-game-repository";

describe("mockGameRepository", () => {
  it("lists the 18 games of the showcase", async () => {
    await expect(mockGameRepository.listGames()).resolves.toHaveLength(18);
  });

  it("returns a copy so callers cannot mutate the mock data", async () => {
    const games = await mockGameRepository.listGames();
    games.pop();

    await expect(mockGameRepository.listGames()).resolves.toHaveLength(18);
  });

  it("finds a game by slug", async () => {
    await expect(mockGameRepository.findGameBySlug("lucha-pixel")).resolves.toMatchObject({
      name: "Lucha Pixel",
      stand: "B7",
    });
  });

  it("returns null for an unknown slug", async () => {
    await expect(mockGameRepository.findGameBySlug("no-existe")).resolves.toBeNull();
  });

  it("uses unique slugs and stands", async () => {
    const games = await mockGameRepository.listGames();

    expect(new Set(games.map((game) => game.slug)).size).toBe(games.length);
    expect(new Set(games.map((game) => game.stand)).size).toBe(games.length);
  });
});

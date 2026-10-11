import { mockGameRepository } from "@features/games/lib/mock/mock-game-repository";
import { getGameRepository } from "@features/games/lib/server/game-repositories";

describe("getGameRepository", () => {
  it("uses the mocks by default", () => {
    expect(getGameRepository()).toBe(mockGameRepository);
    expect(getGameRepository("mock")).toBe(mockGameRepository);
  });

  it("fails with a clear message when the data source has no repository yet", () => {
    expect(() => getGameRepository("prisma")).toThrow('DATA_SOURCE="prisma" todavía no tiene repositorio de juegos');
  });
});

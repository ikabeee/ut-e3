import { selectGameRepository, type GameRepository } from "@features/games/lib/game-repository";

const mockRepository: GameRepository = {
  listGames: async () => [],
  findGameBySlug: async () => null,
};

const postgresRepository: GameRepository = {
  listGames: async () => [],
  findGameBySlug: async () => null,
};

const repositories = { mock: mockRepository, prisma: postgresRepository };

describe("selectGameRepository", () => {
  it("selects the repository registered for the source", () => {
    expect(selectGameRepository("mock", repositories)).toBe(mockRepository);
    expect(selectGameRepository("prisma", repositories)).toBe(postgresRepository);
  });

  it("fails when the source has no registered repository", () => {
    expect(() => selectGameRepository("prisma", { mock: mockRepository })).toThrow('DATA_SOURCE="prisma"');
  });
});

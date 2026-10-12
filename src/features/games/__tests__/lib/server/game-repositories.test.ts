import { mockGameRepository } from "@features/games/lib/mock/mock-game-repository";
import { getGameRepository } from "@features/games/lib/server/game-repositories";
import { prismaGameRepository } from "@features/games/lib/server/prisma-game-repository";

// La prueba sólo revisa la elección del repositorio: no carga el cliente de Prisma.
jest.mock("@features/games/lib/server/prisma-game-repository", () => ({
  prismaGameRepository: { listGames: jest.fn(), findGameBySlug: jest.fn() },
}));

describe("getGameRepository", () => {
  it("uses the mocks by default", () => {
    expect(getGameRepository()).toBe(mockGameRepository);
    expect(getGameRepository("mock")).toBe(mockGameRepository);
  });

  it("uses PostgreSQL with DATA_SOURCE=prisma", () => {
    expect(getGameRepository("prisma")).toBe(prismaGameRepository);
  });
});

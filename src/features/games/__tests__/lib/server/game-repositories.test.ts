import { getGameRepository } from "@features/games/lib/server/game-repositories";
import { prismaGameRepository } from "@features/games/lib/server/prisma-game-repository";

describe("getGameRepository", () => {
  it("returns the prisma game repository", () => {
    expect(getGameRepository()).toBe(prismaGameRepository);
  });
});

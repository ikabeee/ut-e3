import { getStandCells, PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import { INFO_STANDS } from "@features/floor-plan/lib/plan-places";
import { toStandOccupant } from "@features/games/lib/game-stand";
import { MOCK_GAMES } from "@features/games/lib/mock/mock-games";

describe("toStandOccupant", () => {
  it("describes the stand with the name, genre and description of the game", () => {
    const game = MOCK_GAMES[0];

    expect(toStandOccupant(game, "portada")).toEqual({
      stand: game.stand,
      title: game.name,
      subtitle: game.genre,
      description: game.description,
      cover: "portada",
    });
  });

  it.each(["wide", "tall"] as const)("finds a free stand for every game in the %s layout", (orientation) => {
    const codes = PLAN_LAYOUTS[orientation].standBlocks.flatMap((block) =>
      getStandCells(block).map((cell) => cell.code),
    );

    for (const game of MOCK_GAMES) {
      expect(codes).toContain(game.stand);
      expect(INFO_STANDS).not.toHaveProperty(game.stand);
    }
  });
});

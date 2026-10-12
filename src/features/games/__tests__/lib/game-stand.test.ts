import { getStandCells, PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import { INFO_STANDS } from "@features/floor-plan/lib/plan-places";
import { makeGameFixture } from "@features/games/__tests__/game-fixtures";
import { toStandOccupants } from "@features/games/lib/game-stand";
import { MOCK_GAMES } from "@features/games/lib/mock/mock-games";

describe("toStandOccupants", () => {
  it("describes each stand with the name, genre and description of the game", () => {
    const game = MOCK_GAMES[0];

    expect(toStandOccupants([game], (current) => `portada de ${current.slug}`)).toEqual([
      {
        stand: game.stand,
        title: game.name,
        subtitle: game.genre,
        description: game.description,
        cover: `portada de ${game.slug}`,
      },
    ]);
  });

  it("leaves out the games whose team has no stand yet", () => {
    const withoutStand = makeGameFixture({
      slug: "nuevo",
      name: "Nuevo",
      genre: "Puzle",
      team: "Equipo Nuevo",
      stand: null,
    });

    expect(toStandOccupants([withoutStand, MOCK_GAMES[0]], () => null).map((occupant) => occupant.stand)).toEqual([
      MOCK_GAMES[0].stand,
    ]);
  });

  it.each(["wide", "tall"] as const)("finds a free stand for every game in the %s layout", (orientation) => {
    const codes = PLAN_LAYOUTS[orientation].standBlocks.flatMap((block) =>
      getStandCells(block).map((cell) => cell.code),
    );

    for (const { stand } of toStandOccupants(MOCK_GAMES, () => null)) {
      expect(codes).toContain(stand);
      expect(INFO_STANDS).not.toHaveProperty(stand);
    }
  });
});

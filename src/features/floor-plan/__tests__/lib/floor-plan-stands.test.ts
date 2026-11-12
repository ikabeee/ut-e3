import { makeGame } from "@features/games/__tests__/components/game-test-data";
import { toFloorPlanStand } from "@features/floor-plan/lib/floor-plan-stands";

describe("toFloorPlanStand", () => {
  it("fills the slug of the game page of the stand", () => {
    const game = makeGame({ id: "ceniza-protocol", name: "Ceniza Protocol" });

    expect(toFloorPlanStand(game).slug).toBe("ceniza-protocol");
  });

  it("keeps the code, name, genre, synopsis and cover of the stand", () => {
    const game = makeGame({ id: "ceniza-protocol", name: "Ceniza Protocol" });
    const stand = toFloorPlanStand(game);

    expect(stand).toMatchObject({
      code: "ZA-S1",
      name: "Ceniza Protocol",
      genre: "Acción",
      synopsis: "Ceniza Protocol, juego de prueba.",
      coverSrc: "/games/ceniza-protocol.jpg",
      coverAlt: "Portada de Ceniza Protocol",
    });
  });
});

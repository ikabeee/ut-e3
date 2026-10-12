import { getGalleryShots } from "@features/games/lib/game-gallery";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";

describe("getGalleryShots", () => {
  it("starts with the cover and follows with the screenshots", () => {
    const ruta9 = GAME_FIXTURES[3];
    const shots = getGalleryShots(ruta9);

    expect(shots.map((shot) => shot.image)).toEqual(ruta9.gallery);
    expect(shots[0]).toEqual({ id: "cover", image: ruta9.image });
  });

  it("gives every shot a unique id", () => {
    const shots = getGalleryShots(GAME_FIXTURES[3]);

    expect(new Set(shots.map((shot) => shot.id)).size).toBe(shots.length);
  });
});

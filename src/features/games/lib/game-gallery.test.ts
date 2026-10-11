import { getCoverVisual, getGalleryShots } from "@features/games/lib/game-gallery";
import { GAME_FIXTURES, makeGameFixture } from "@features/games/lib/game-fixtures";

describe("getGalleryShots", () => {
  it("starts with the cover image and adds three generated shots", () => {
    const ceniza = GAME_FIXTURES[0];
    const shots = getGalleryShots(ceniza, GAME_FIXTURES.length);

    expect(shots).toHaveLength(4);
    expect(shots[0]).toMatchObject({ kind: "image", image: ceniza.image });
    expect(shots.slice(1).every((shot) => shot.kind === "art")).toBe(true);
  });

  it("uses the same seeds and backgrounds as the design", () => {
    // "Subsuelo" en el catálogo de 18 juegos del diseño.
    const subsuelo = makeGameFixture({
      slug: "subsuelo",
      name: "Subsuelo",
      genre: "Roguelike",
      team: "Equipo Fosa",
      stand: "B1",
      art: { seed: 4, palette: ["acid", "black"] },
    });
    const shots = getGalleryShots(subsuelo, 18);

    expect(shots.map((shot) => (shot.kind === "art" ? shot.art : null))).toEqual([
      { seed: 4, palette: ["acid", "black"] },
      { seed: 13, palette: ["acid", "black"] },
      { seed: 19, palette: ["acid", "panel"] },
      { seed: 11, palette: ["acid", "black"] },
    ]);
  });

  it("gives every shot a unique id", () => {
    const shots = getGalleryShots(GAME_FIXTURES[9], GAME_FIXTURES.length);

    expect(new Set(shots.map((shot) => shot.id)).size).toBe(shots.length);
  });
});

describe("getCoverVisual", () => {
  it("falls back to the generated art when there is no image", () => {
    expect(getCoverVisual(GAME_FIXTURES[10])).toEqual({ kind: "art", art: GAME_FIXTURES[10].art });
  });
});

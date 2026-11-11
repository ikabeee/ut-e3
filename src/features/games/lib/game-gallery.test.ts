import { getCoverVisual, getGalleryShots } from "@features/games/lib/game-gallery";
import { MOCK_GAMES } from "@features/games/lib/mock-games";

describe("getGalleryShots", () => {
  it("starts with the cover image and adds three generated shots", () => {
    const ceniza = MOCK_GAMES[0];
    const shots = getGalleryShots(ceniza, MOCK_GAMES.length);

    expect(shots).toHaveLength(4);
    expect(shots[0]).toMatchObject({ kind: "image", image: ceniza.image });
    expect(shots.slice(1).every((shot) => shot.kind === "art")).toBe(true);
  });

  it("uses the same seeds and backgrounds as the design", () => {
    const subsuelo = MOCK_GAMES[4];
    const shots = getGalleryShots(subsuelo, MOCK_GAMES.length);

    expect(shots.map((shot) => (shot.kind === "art" ? shot.art : null))).toEqual([
      { seed: 4, palette: ["acid", "black"] },
      { seed: 13, palette: ["acid", "black"] },
      { seed: 19, palette: ["acid", "panel"] },
      { seed: 11, palette: ["acid", "black"] },
    ]);
  });

  it("gives every shot a unique id", () => {
    const shots = getGalleryShots(MOCK_GAMES[9], MOCK_GAMES.length);

    expect(new Set(shots.map((shot) => shot.id)).size).toBe(shots.length);
  });
});

describe("getCoverVisual", () => {
  it("falls back to the generated art when there is no image", () => {
    expect(getCoverVisual(MOCK_GAMES[17])).toEqual({ kind: "art", art: MOCK_GAMES[17].art });
  });
});

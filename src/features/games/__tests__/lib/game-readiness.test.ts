import { makeGame } from "@features/games/__tests__/components/game-test-data";
import { isGameReady } from "@features/games/lib/game-readiness";
import type { GameImage } from "@features/games/lib/types";

const COVER: GameImage = { path: "/games/vaporlock.jpg", alt: "Portada de Vaporlock", position: 1, isCover: true };

const LANDSCAPE: GameImage = {
  path: "/games/vaporlock-portada.jpg",
  alt: "Portada horizontal de Vaporlock",
  position: 2,
  isCover: false,
};

describe("isGameReady", () => {
  it("is false for a game without images (Make 'em Fall, One Mind, Sombra del Mictlán)", () => {
    expect(isGameReady(makeGame({ id: "one-mind", name: "One Mind", images: [] }))).toBe(false);
  });

  it("is false for a game with only the vertical cover (Vaporlock)", () => {
    expect(isGameReady(makeGame({ id: "vaporlock", name: "Vaporlock", images: [COVER] }))).toBe(false);
  });

  it("is false for a game with only a horizontal image", () => {
    expect(isGameReady(makeGame({ id: "vaporlock", name: "Vaporlock", images: [LANDSCAPE] }))).toBe(false);
  });

  it("is true for a game with its vertical cover and its horizontal image, in any stored order", () => {
    expect(isGameReady(makeGame({ id: "vaporlock", name: "Vaporlock", images: [COVER, LANDSCAPE] }))).toBe(true);
    expect(isGameReady(makeGame({ id: "vaporlock", name: "Vaporlock", images: [LANDSCAPE, COVER] }))).toBe(true);
  });
});

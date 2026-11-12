import { makeGame } from "@features/games/__tests__/components/game-test-data";
import { getCoverImage, getGalleryImages, getHeroImage } from "@features/games/lib/game-cover";
import type { GameImage } from "@features/games/lib/types";

describe("getCoverImage", () => {
  it("returns the image marked as the cover", () => {
    const gallery: GameImage = {
      path: "/games/ruta-9-pits.jpg",
      alt: "Ruta 9: entrada a pits",
      position: 1,
      isCover: false,
    };

    const cover: GameImage = { path: "/games/ruta-9.jpg", alt: "Portada de Ruta 9", position: 2, isCover: true };
    const game = makeGame({ id: "ruta-9", name: "Ruta 9", images: [gallery, cover] });

    expect(getCoverImage(game)).toBe(cover);
  });
});

describe("a game without artwork", () => {
  it("has no cover and an empty gallery", () => {
    const game = makeGame({ id: "one-mind", name: "One Mind", images: [] });

    expect(getCoverImage(game)).toBeNull();
    expect(getHeroImage(game)).toBeNull();
    expect(getGalleryImages(game)).toEqual([]);
  });
});

const COVER: GameImage = { path: "/games/vaporlock.jpg", alt: "Portada de Vaporlock", position: 1, isCover: true };

const LANDSCAPE: GameImage = {
  path: "/games/vaporlock-portada.jpg",
  alt: "Portada horizontal de Vaporlock",
  position: 2,
  isCover: false,
};

describe("getHeroImage", () => {
  it("is the landscape image, even though the vertical cover has the first position", () => {
    const game = makeGame({ id: "vaporlock", name: "Vaporlock", images: [COVER, LANDSCAPE] });

    expect(getHeroImage(game)).toBe(LANDSCAPE);
  });

  it("is the first image after the cover when there are several", () => {
    const later: GameImage = { ...LANDSCAPE, path: "/games/vaporlock-meta.jpg", position: 3 };
    const game = makeGame({ id: "vaporlock", name: "Vaporlock", images: [later, COVER, LANDSCAPE] });

    expect(getHeroImage(game)).toBe(LANDSCAPE);
  });

  it("keeps the vertical cover for a game without a landscape image", () => {
    const game = makeGame({ id: "vaporlock", name: "Vaporlock", images: [COVER] });

    expect(getHeroImage(game)).toBe(COVER);
    expect(getGalleryImages(game)).toEqual([COVER]);
  });

  it("does not change the stored images or their order", () => {
    const images = [COVER, LANDSCAPE];
    const game = makeGame({ id: "vaporlock", name: "Vaporlock", images });

    getGalleryImages(game);

    expect(game.images).toEqual([COVER, LANDSCAPE]);
    expect(getCoverImage(game)).toBe(COVER);
  });
});

describe("getGalleryImages", () => {
  it("opens on the landscape image, then the vertical cover", () => {
    const game = makeGame({ id: "vaporlock", name: "Vaporlock", images: [COVER, LANDSCAPE] });

    expect(getGalleryImages(game)).toEqual([LANDSCAPE, COVER]);
  });

  it("puts the hero first, then the cover and the other images in position order", () => {
    // Position 1 is the first image after the cover: it is the hero.
    const pits: GameImage = { path: "/games/ruta-9-pits.jpg", alt: "Ruta 9: pits", position: 1, isCover: false };
    const cover: GameImage = { path: "/games/ruta-9.jpg", alt: "Portada de Ruta 9", position: 2, isCover: true };
    const finish: GameImage = { path: "/games/ruta-9-meta.jpg", alt: "Ruta 9: meta", position: 3, isCover: false };
    const game = makeGame({ id: "ruta-9", name: "Ruta 9", images: [finish, cover, pits] });

    expect(getGalleryImages(game)).toEqual([pits, cover, finish]);
  });
});

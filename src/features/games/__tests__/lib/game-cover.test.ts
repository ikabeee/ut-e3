import { makeGame } from "@features/games/__tests__/components/game-test-data";
import { getCoverImage, getGalleryImages } from "@features/games/lib/game-cover";
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

describe("getGalleryImages", () => {
  it("puts the cover first and the other images in position order", () => {
    const pits: GameImage = { path: "/games/ruta-9-pits.jpg", alt: "Ruta 9: pits", position: 1, isCover: false };
    const cover: GameImage = { path: "/games/ruta-9.jpg", alt: "Portada de Ruta 9", position: 2, isCover: true };
    const finish: GameImage = { path: "/games/ruta-9-meta.jpg", alt: "Ruta 9: meta", position: 3, isCover: false };
    const game = makeGame({ id: "ruta-9", name: "Ruta 9", images: [finish, cover, pits] });

    expect(getGalleryImages(game)).toEqual([cover, pits, finish]);
  });
});

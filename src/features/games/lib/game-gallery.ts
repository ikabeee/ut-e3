import type { Game, GameImage } from "@features/games/lib/types";

export interface GalleryShot {
  id: string;
  image: GameImage;
}

/** Galería del detalle: la portada y las capturas del juego, en su orden. */
export function getGalleryShots(game: Game): GalleryShot[] {
  return game.gallery.map((image, index) => ({ id: index === 0 ? "cover" : `shot-${index}`, image }));
}

import type { Game, GameImage } from "@features/games/lib/types";

// The cover of a game that the stand administrator registered; the sysadmin replaces it with the real one.
export const GENERIC_COVER_PATH = "/games/generic-cover.jpg";

/**
 * The images of the gallery: the hero image first, then the vertical cover and the rest in position order. A game
 * without a cover has none: the pages show a generic cover. The stored order and positions are not touched.
 */
export function getGalleryImages(game: Game): GameImage[] {
  const cover = getCoverImage(game);

  if (!cover) return [];

  const hero = getHeroImage(game);
  const others = game.images.filter((image) => image !== cover && image !== hero).toSorted(byPosition);

  return hero === cover ? [cover, ...others] : [hero, cover, ...others].filter(isImage);
}

/** The cover of a game, or null while it has no artwork (a generic cover with its title stands in for it). */
export function getCoverImage(game: Game): GameImage | null {
  return game.images.find((image) => image.isCover) ?? null;
}

/**
 * The big image of the hero (the featured carousel, the top of the game page and the shared image): the landscape one.
 * By convention it is the first image after the vertical cover (`<slug>-portada.jpg`, 16:9); a game without it keeps
 * the vertical cover, and one without artwork has none.
 */
export function getHeroImage(game: Game): GameImage | null {
  const landscape = game.images.filter((image) => !image.isCover).toSorted(byPosition)[0];

  return landscape ?? getCoverImage(game);
}

function isImage(image: GameImage | null): image is GameImage {
  return image !== null;
}

function byPosition(first: GameImage, second: GameImage): number {
  return first.position - second.position;
}

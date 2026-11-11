import type { Game, GameImage } from "@features/games/lib/types";

// The cover of a game that the stand administrator registered; the sysadmin replaces it with the real one.
export const GENERIC_COVER_PATH = "/games/generic-cover.jpg";

/** The images of the gallery, the cover first. A game without a cover has none: the pages show a generic cover. */
export function getGalleryImages(game: Game): GameImage[] {
  const cover = getCoverImage(game);

  if (!cover) return [];

  const others = game.images.filter((image) => image !== cover).toSorted(byPosition);

  return [cover, ...others];
}

/** The cover of a game, or null while it has no artwork (a generic cover with its title stands in for it). */
export function getCoverImage(game: Game): GameImage | null {
  return game.images.find((image) => image.isCover) ?? null;
}

function byPosition(first: GameImage, second: GameImage): number {
  return first.position - second.position;
}

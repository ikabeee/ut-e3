import type { Game, GameImage } from "@features/games/lib/types";

export function getGalleryImages(game: Game): GameImage[] {
  const cover = getCoverImage(game);
  const others = game.images.filter((image) => image !== cover).toSorted(byPosition);

  return [cover, ...others];
}

export function getCoverImage(game: Game): GameImage {
  const cover = game.images.find((image) => image.isCover);

  if (!cover) {
    throw new Error(`The game "${game.name}" has no cover image.`);
  }

  return cover;
}

function byPosition(first: GameImage, second: GameImage): number {
  return first.position - second.position;
}

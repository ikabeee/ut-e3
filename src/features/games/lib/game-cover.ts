import type { Game, GameImage } from "@features/games/lib/types";

export function getCoverImage(game: Game): GameImage {
  const cover = game.images.find((image) => image.isCover);

  if (!cover) {
    throw new Error(`The game "${game.name}" has no cover image.`);
  }

  return cover;
}

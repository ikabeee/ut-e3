import { getCoverImage, getLandscapeImage } from "@features/games/lib/game-cover";
import type { Game } from "@features/games/lib/types";

/**
 * A game is ready for the public site when it has both its vertical cover and its horizontal image. The public reads
 * (lib/server/games-queries.ts and itch-queries.ts) hide the others; the staff screens still see them to complete
 * the artwork.
 */
export function isGameReady(game: Pick<Game, "images">): boolean {
  return getCoverImage(game) !== null && getLandscapeImage(game) !== null;
}

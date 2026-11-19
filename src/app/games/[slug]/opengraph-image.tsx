import { gameDetailOgImageAlt, renderGameDetailOgImage } from "@features/games/pages/game-detail-page";
import { OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE } from "@shared/lib/metadata";

// The page of the game names this image in its metadata with the alt text of its own game.
export const alt = gameDetailOgImageAlt;

export const size = OG_IMAGE_SIZE;

export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function Image({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  return renderGameDetailOgImage({ params });
}

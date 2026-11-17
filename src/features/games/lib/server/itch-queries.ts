import "server-only";
import { isGameReady } from "@features/games/lib/game-readiness";
import { getPrisma } from "@shared/lib/server/prisma";

export interface GameItch {
  itchUrl: string | null;
}

/**
 * The itch.io link of a game, or `null` for a game that does not exist or that the public site does not show yet
 * (it lacks its artwork, see isGameReady). Not cached: it never reaches the pages.
 */
export async function getGameItch(slug: string): Promise<GameItch | null> {
  const game = await getPrisma().game.findUnique({
    where: { slug },
    select: { itchUrl: true, images: { select: { position: true, isCover: true, path: true, alt: true } } },
  });

  return game && isGameReady(game) ? { itchUrl: game.itchUrl } : null;
}

import "server-only";
import { getPrisma } from "@shared/lib/server/prisma";

export interface GameItch {
  itchUrl: string | null;
}

/** The itch.io link of a game, or `null` for a game that does not exist. Not cached: it never reaches the pages. */
export async function getGameItch(slug: string): Promise<GameItch | null> {
  return getPrisma().game.findUnique({ where: { slug }, select: { itchUrl: true } });
}

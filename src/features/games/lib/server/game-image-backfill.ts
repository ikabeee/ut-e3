import "server-only";
import { INITIAL_GAMES } from "@features/games/lib/server/games-seed";
import type { PrismaClient } from "@generated/prisma/client";

/**
 * Adds the images of the initial list that a database that already has its games is missing (the seed only fills an
 * empty catalog). Safe to run again: it only creates the rows of a position that has no image, so it never replaces
 * or reorders what the sysadmin or a stand admin changed. Returns the paths it added.
 */
export async function backfillGameImages(prisma: PrismaClient): Promise<string[]> {
  const added: string[] = [];

  for (const { slug, images } of INITIAL_GAMES) {
    const game = await prisma.game.findUnique({ where: { slug }, include: { images: true } });

    if (!game) continue;

    const taken = new Set(game.images.map((image) => image.position));

    for (const image of images.filter(({ position }) => !taken.has(position))) {
      await prisma.gameImage.create({ data: { ...image, gameId: game.id } });
      added.push(image.path);
    }
  }

  return added;
}

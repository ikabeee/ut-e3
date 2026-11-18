import "server-only";
import type { GameImage, Genre, StandGame } from "@features/games/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";

/** The game of one stand, or `null` while the stand has not registered it (RF-34). */
export async function getStandGame(standId: string): Promise<StandGame | null> {
  return getPrisma().game.findUnique({
    where: { standId },
    select: { name: true, synopsis: true, genreId: true, itchUrl: true },
  });
}

/** The images of the game of one stand, in position order, with the slug that names its files; null without a game. */
export async function getStandGameImages(
  standId: string,
): Promise<{ name: string; slug: string; images: GameImage[] } | null> {
  return getPrisma().game.findUnique({
    where: { standId },
    select: {
      name: true,
      slug: true,
      images: { select: { path: true, alt: true, position: true, isCover: true }, orderBy: { position: "asc" } },
    },
  });
}

export async function listGenres(): Promise<Genre[]> {
  return getPrisma().genre.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } });
}

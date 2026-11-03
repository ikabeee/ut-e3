import "server-only";
import type { Genre, StandGame } from "@features/games/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";

/** The game of one stand, or `null` while the stand has not registered it (RF-34). */
export async function getStandGame(standId: string): Promise<StandGame | null> {
  return getPrisma().game.findUnique({
    where: { standId },
    select: { name: true, synopsis: true, genreId: true, itchUrl: true },
  });
}

export async function listGenres(): Promise<Genre[]> {
  return getPrisma().genre.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } });
}

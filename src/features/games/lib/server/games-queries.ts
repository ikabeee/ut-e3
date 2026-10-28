import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Game } from "@features/games/lib/types";
import type { Prisma } from "@generated/prisma/client";
import { getPrisma } from "@shared/lib/server/prisma";

export const GAMES_CACHE_TAG = "games";

// Selects exactly the fields of the Game domain type, so a row needs no mapping.
const GAME_FIELDS = {
  id: true,
  slug: true,
  name: true,
  synopsis: true,
  itchUrl: true,
  genre: { select: { id: true, name: true, slug: true } },
  stand: { select: { zone: true, number: true } },
  images: { select: { path: true, alt: true, position: true, isCover: true }, orderBy: { position: "asc" } },
} satisfies Prisma.GameSelect;

export async function getGames(): Promise<Game[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(GAMES_CACHE_TAG);

  const games = await getPrisma().game.findMany({ select: GAME_FIELDS });

  return games.toSorted(compareByStand);
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(GAMES_CACHE_TAG);

  return getPrisma().game.findUnique({ where: { slug }, select: GAME_FIELDS });
}

function compareByStand(first: Game, second: Game): number {
  return first.stand.zone.localeCompare(second.stand.zone) || first.stand.number - second.stand.number;
}

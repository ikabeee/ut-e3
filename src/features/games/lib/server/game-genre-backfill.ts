import "server-only";
import { INITIAL_GAMES, TO_BE_ANNOUNCED } from "@features/games/lib/server/games-seed";
import { buildGameSlug } from "@features/games/lib/game-slug";
import type { Genre } from "@features/games/lib/types";
import type { Prisma, PrismaClient } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";

export interface GenreBackfillResult {
  /** Games that got their confirmed genre. */
  updated: string[];
  /** Games that already had it. */
  alreadySet: string[];
  /** Games whose genre is not the placeholder: somebody changed it by hand, so it stays. */
  keptByHand: string[];
  /** Games of the list that are not in this database. */
  missing: string[];
}

// Other ways the same genre may already be written in a database (the sysadmin creates genres by hand), as slugs.
const ALIASES = new Map<string, readonly string[]>([
  ["plataformas", ["plataforma", "plataformer", "platformer"]],
  ["rpg", ["rol", "rol-rpg", "rpg-rol"]],
  ["accion", ["action"]],
  ["terror", ["horror"]],
  ["sigilo", ["stealth"]],
  ["simulacion", ["simulation"]],
  ["roguelike", ["rogue-like"]],
]);

const AUDIT_ACTION = "game.genre_backfill";

/**
 * Gives the games of the initial list their confirmed genre in a database that already has them: the seed only fills an
 * empty catalog. It is safe to run again: it only changes a game whose genre is still the placeholder "Por anunciar"
 * (never one that the sysadmin changed), it ignores the games that are not in the list, and it reuses an existing genre
 * with the same name ("Plataforma", "Rol (RPG)"...) before creating one. Every change is audited without an actor.
 */
export async function backfillGameGenres(prisma: PrismaClient): Promise<GenreBackfillResult> {
  const result: GenreBackfillResult = { updated: [], alreadySet: [], keptByHand: [], missing: [] };

  await prisma.$transaction(async (transaction) => {
    for (const { slug, genre } of INITIAL_GAMES) {
      if (genre.slug === TO_BE_ANNOUNCED.slug) continue;

      await backfillGame(transaction, { slug, genre }, result);
    }
  });

  return result;
}

async function backfillGame(
  prisma: Prisma.TransactionClient,
  target: { slug: string; genre: Genre },
  result: GenreBackfillResult,
): Promise<void> {
  const game = await prisma.game.findUnique({ where: { slug: target.slug }, include: { genre: true } });

  if (!game) result.missing.push(target.slug);
  else if (isTarget(game.genre, target.genre)) result.alreadySet.push(target.slug);
  else if (game.genre.slug !== TO_BE_ANNOUNCED.slug) result.keptByHand.push(target.slug);
  else {
    const genreId = await findOrCreateGenre(prisma, target.genre);

    await prisma.game.update({ where: { id: game.id }, data: { genreId } });
    await recordAudit(prisma, {
      actorId: null,
      action: AUDIT_ACTION,
      entityType: "game",
      entityId: game.id,
      detail: { slug: target.slug, from: game.genre.name, to: target.genre.name },
    });
    result.updated.push(target.slug);
  }
}

function isTarget(current: { name: string }, target: Genre): boolean {
  return getEquivalentSlugs(target).has(buildGameSlug(current.name));
}

async function findOrCreateGenre(prisma: Prisma.TransactionClient, target: Genre): Promise<string> {
  const equivalents = getEquivalentSlugs(target);
  const genres = await prisma.genre.findMany();
  const existing = genres.find((genre) => equivalents.has(buildGameSlug(genre.name)) || genre.slug === target.slug);

  if (existing) return existing.id;

  return (await prisma.genre.create({ data: { name: target.name, slug: target.slug } })).id;
}

function getEquivalentSlugs({ slug }: Genre): Set<string> {
  return new Set([slug, ...(ALIASES.get(slug) ?? [])]);
}

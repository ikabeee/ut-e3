import "server-only";
import { GENERIC_COVER_PATH } from "@features/games/lib/game-cover";
import type { StandGameInput } from "@features/games/lib/game-input";
import { buildGameSlug, pickFreeSlug } from "@features/games/lib/game-slug";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { isUniqueViolation } from "@shared/lib/server/database-errors";
import { getPrisma } from "@shared/lib/server/prisma";

export interface SaveStandGameResult {
  status: "created" | "updated" | "invalidGenre" | "conflict";
}

interface SaveStandGameRequest {
  /** The account of the session and the stand it belongs to: both come from the session and never from the form. */
  actor: { id: string; standId: string };
  input: StandGameInput;
}

/**
 * Registers the game of the stand of the actor, or updates it (RF-31, RF-34). A stand has one game, found by the stand
 * of the actor and not by an id from the form, so nobody can change the game of another stand. A new game gets the
 * generic cover; the images belong to the sysadmin.
 */
export async function saveStandGame({ actor, input }: SaveStandGameRequest): Promise<SaveStandGameResult> {
  try {
    return await getPrisma().$transaction((transaction) => saveInTransaction(transaction, { actor, input }));
  } catch (cause) {
    if (isUniqueViolation(cause)) return { status: "conflict" };

    throw cause;
  }
}

async function saveInTransaction(
  transaction: Prisma.TransactionClient,
  { actor, input }: SaveStandGameRequest,
): Promise<SaveStandGameResult> {
  if (!(await transaction.genre.findUnique({ where: { id: input.genreId }, select: { id: true } }))) {
    return { status: "invalidGenre" };
  }

  const existing = await transaction.game.findUnique({ where: { standId: actor.standId }, select: { id: true } });

  const gameId = existing
    ? await updateGame(transaction, { gameId: existing.id, input })
    : await createGame(transaction, { standId: actor.standId, input });

  await recordAudit(transaction, {
    actorId: actor.id,
    action: existing ? "game.update" : "game.create",
    entityType: "game",
    entityId: gameId,
    detail: { standId: actor.standId },
  });

  return { status: existing ? "updated" : "created" };
}

async function createGame(
  transaction: Prisma.TransactionClient,
  { standId, input }: { standId: string; input: StandGameInput },
): Promise<string> {
  const slug = await findFreeSlug(transaction, input.name);

  const game = await transaction.game.create({
    data: {
      standId,
      slug,
      name: input.name,
      synopsis: input.synopsis,
      genreId: input.genreId,
      itchUrl: input.itchUrl,
      images: { create: { path: GENERIC_COVER_PATH, alt: buildCoverAlt(input.name), position: 1, isCover: true } },
    },
    select: { id: true },
  });

  return game.id;
}

// The slug stays the same on an update, so the links to the game keep working.
async function updateGame(
  transaction: Prisma.TransactionClient,
  { gameId, input }: { gameId: string; input: StandGameInput },
): Promise<string> {
  await transaction.game.update({
    where: { id: gameId },
    data: { name: input.name, synopsis: input.synopsis, genreId: input.genreId, itchUrl: input.itchUrl },
  });
  // Only the generic cover follows the name: a cover that the sysadmin loaded keeps its own description.
  await transaction.gameImage.updateMany({
    where: { gameId, path: GENERIC_COVER_PATH },
    data: { alt: buildCoverAlt(input.name) },
  });

  return gameId;
}

async function findFreeSlug(transaction: Prisma.TransactionClient, name: string): Promise<string> {
  const base = buildGameSlug(name);
  const similar = await transaction.game.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } });

  return pickFreeSlug(base, new Set(similar.map((game) => game.slug)));
}

function buildCoverAlt(name: string): string {
  return `Portada de ${name}`;
}

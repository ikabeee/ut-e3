import "server-only";
import { createHash } from "node:crypto";
import {
  buildGameMediaUrl,
  readStoredFileName,
  removeGameImage,
  storeGameImage,
} from "@features/games/lib/server/game-image-storage";
import { buildGameImageFileName, isScreenshotSlot, type GameImageSlot } from "@features/games/lib/game-image-slots";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";

type Actor = { id: string; standId: string };

export type SaveStandGameImageResult = { status: "saved" } | { status: "noGame" };

export type DeleteStandGameImageResult = { status: "removed" } | { status: "onlyScreenshots" | "emptySlot" | "noGame" };

const VERSION_LENGTH = 8;

/**
 * Stores the image of one slot of the game of the stand of the actor (RF-31). The bytes were validated by the caller.
 * The file is written first under a name that carries a hash of its content, so it never overwrites the image on show;
 * then the row changes in a transaction. If the database fails the new file is removed, and once it commits the file
 * that the row used to point to goes away.
 */
export async function saveStandGameImage(request: {
  actor: Actor;
  slot: GameImageSlot;
  bytes: Uint8Array;
}): Promise<SaveStandGameImageResult> {
  const { actor, slot, bytes } = request;
  const game = await findGameOfStand(actor.standId);

  if (!game) return { status: "noGame" };

  const fileName = buildGameImageFileName(game.slug, slot, hashVersion(bytes));
  const newPath = buildGameMediaUrl(fileName);
  const previous = game.images.find((image) => image.position === slot.position);

  await storeGameImage(fileName, bytes);

  try {
    await getPrisma().$transaction((transaction) => writeSlotRow(transaction, { actor, game, slot, newPath }));
  } catch (cause) {
    if (previous?.path !== newPath) await removeGameImage(fileName);

    throw cause;
  }

  if (previous && previous.path !== newPath) await removeUnreferencedFiles([previous.path]);

  return { status: "saved" };
}

/** Removes a screenshot of the game of the stand of the actor, with its file. The card and the cover are replaced. */
export async function deleteStandGameImage(request: {
  actor: Actor;
  slot: GameImageSlot;
}): Promise<DeleteStandGameImageResult> {
  const { actor, slot } = request;

  if (!isScreenshotSlot(slot)) return { status: "onlyScreenshots" };

  const game = await findGameOfStand(actor.standId);

  if (!game) return { status: "noGame" };

  const image = game.images.find((candidate) => candidate.position === slot.position);

  if (!image) return { status: "emptySlot" };

  await getPrisma().$transaction(async (transaction) => {
    await transaction.gameImage.deleteMany({ where: { gameId: game.id, position: slot.position } });
    await recordAudit(transaction, {
      actorId: actor.id,
      action: "game.image.delete",
      entityType: "game",
      entityId: game.id,
      detail: { standId: actor.standId, slot: slot.id },
    });
  });
  await removeUnreferencedFiles([image.path]);

  return { status: "removed" };
}

/** Deletes the files of images whose rows are gone, unless another row still points to the same file. */
export async function removeUnreferencedFiles(imagePaths: readonly string[]): Promise<void> {
  for (const imagePath of imagePaths) {
    const fileName = readStoredFileName(imagePath);

    if (fileName && (await getPrisma().gameImage.count({ where: { path: imagePath } })) === 0) {
      await removeGameImage(fileName);
    }
  }
}

type GameOfStand = NonNullable<Awaited<ReturnType<typeof findGameOfStand>>>;

// The game is the one of the stand of the session, found by the stand and never by an id from the form.
async function findGameOfStand(standId: string) {
  return getPrisma().game.findUnique({
    where: { standId },
    select: { id: true, slug: true, name: true, images: { select: { path: true, position: true } } },
  });
}

async function writeSlotRow(
  transaction: Prisma.TransactionClient,
  request: { actor: Actor; game: GameOfStand; slot: GameImageSlot; newPath: string },
): Promise<void> {
  const { actor, game, slot, newPath } = request;
  const data = { path: newPath, alt: buildAlt(game.name, slot), isCover: slot.isCover };

  await transaction.gameImage.upsert({
    where: { gameId_position: { gameId: game.id, position: slot.position } },
    update: data,
    create: { gameId: game.id, position: slot.position, ...data },
  });
  await recordAudit(transaction, {
    actorId: actor.id,
    action: "game.image.save",
    entityType: "game",
    entityId: game.id,
    detail: { standId: actor.standId, slot: slot.id, file: newPath },
  });
}

function buildAlt(name: string, slot: GameImageSlot): string {
  if (slot.isCover) return `Portada de ${name}`;

  return isScreenshotSlot(slot) ? `Captura ${slot.position - 2} de ${name}` : `Portada horizontal de ${name}`;
}

function hashVersion(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex").slice(0, VERSION_LENGTH);
}

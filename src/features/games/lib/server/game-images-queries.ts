import "server-only";
import type { GameImageInput, GameImageRecord } from "@features/games/lib/types";
import { db } from "@shared/lib/prisma/db";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";
import { isUuid } from "@shared/lib/validation";

// Fotos de los juegos (portada y capturas) para el panel de administración. La validación
// de dimensiones, peso y formato se define en el issue #62.

const GAME_NOT_FOUND = "El juego ya no existe.";
const IMAGE_NOT_FOUND = "La foto ya no existe.";

const IMAGE_FIELDS = ["id", "imageUrl", "altText", "cropPosition", "isCover", "sortOrder"] as const;

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Un juego tiene una sola portada: si la nueva lo es, la anterior deja de serlo. */
async function clearCover(tx: Transaction, gameId: string, exceptImageId?: string) {
  const covers = tx.orm.public.GameImage.where({ gameId, isCover: true });
  if (exceptImageId) {
    await covers.where((image) => image.id.neq(exceptImageId)).updateAll({ isCover: false });
  } else {
    await covers.updateAll({ isCover: false });
  }
}

export async function addGameImage(gameId: string, input: GameImageInput): Promise<GameImageRecord> {
  if (!isUuid(gameId)) throw new RecordNotFoundError(GAME_NOT_FOUND);
  return db.transaction(async (tx) => {
    if (input.isCover) await clearCover(tx, gameId);
    return tx.orm.public.GameImage.select(...IMAGE_FIELDS).create({ ...input, gameId });
  });
}

export async function updateGameImage(id: string, input: GameImageInput): Promise<GameImageRecord> {
  const image = isUuid(id) ? await db.orm.public.GameImage.select("gameId").where({ id }).first() : null;
  if (!image) throw new RecordNotFoundError(IMAGE_NOT_FOUND);

  return db.transaction(async (tx) => {
    if (input.isCover) await clearCover(tx, image.gameId, id);
    const updated = await tx.orm.public.GameImage.select(...IMAGE_FIELDS)
      .where({ id })
      .update(input);
    if (!updated) throw new RecordNotFoundError(IMAGE_NOT_FOUND);
    return updated;
  });
}

/** Borra la foto. Si era la portada, el juego deja de mostrarse hasta que tenga otra. */
export async function deleteGameImage(id: string): Promise<void> {
  const deleted = isUuid(id) ? await db.orm.public.GameImage.where({ id }).delete() : null;
  if (!deleted) throw new RecordNotFoundError(IMAGE_NOT_FOUND);
}

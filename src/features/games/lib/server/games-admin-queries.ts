import "server-only";
import { connection } from "next/server";
import type { GameInput, GameRecord } from "@features/games/lib/types";
import { db } from "@shared/lib/prisma/db";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";
import { isUuid } from "@shared/lib/validation";

// CRUD de juegos para el panel de administración. A diferencia del repositorio del sitio
// (prisma-game-repository.ts, con caché), aquí se leen también los juegos sin portada.

const GAME_NOT_FOUND = "El juego ya no existe.";

function gameRecords() {
  return db.orm.public.Game.select(
    "id",
    "teamId",
    "genreId",
    "slug",
    "name",
    "description",
    "about",
    "players",
    "itchioUrl",
    "sortOrder",
  )
    .include("extraGenres", (extraGenres) => extraGenres.select("genreId"))
    .include("platforms", (platforms) => platforms.select("platformId"))
    .include("images", (images) =>
      images
        .select("id", "imageUrl", "altText", "cropPosition", "isCover", "sortOrder")
        .orderBy((image) => image.sortOrder.asc()),
    );
}

type GameRecordRow = NonNullable<Awaited<ReturnType<ReturnType<typeof gameRecords>["first"]>>>;

function toGameRecord({ extraGenres, platforms, images, ...game }: GameRecordRow): GameRecord {
  return {
    ...game,
    extraGenreIds: extraGenres.map((entry) => entry.genreId),
    platformIds: platforms.map((entry) => entry.platformId),
    images: images.map((image) => ({ ...image })),
  };
}

async function findGameOrThrow(id: string): Promise<GameRecord> {
  const row = isUuid(id) ? await gameRecords().where({ id }).first() : null;

  if (!row) throw new RecordNotFoundError(GAME_NOT_FOUND);

  return toGameRecord(row);
}

export async function listGameRecords(): Promise<GameRecord[]> {
  await connection();

  const rows = await gameRecords()
    .orderBy([(game) => game.sortOrder.asc(), (game) => game.name.asc()])
    .all();

  return rows.map(toGameRecord);
}

export async function getGameRecord(id: string): Promise<GameRecord | null> {
  await connection();

  if (!isUuid(id)) return null;
  const row = await gameRecords().where({ id }).first();

  return row ? toGameRecord(row) : null;
}

/**
 * Separa las columnas del juego de sus listas de géneros extra y plataformas. Las columnas se
 * nombran una por una: un campo de más en `input` nunca llega a la base.
 */
function splitGameInput(input: GameInput) {
  const { teamId, genreId, slug, name, description, about, players, itchioUrl, sortOrder } = input;

  return {
    game: { teamId, genreId, slug, name, description, about, players, itchioUrl, sortOrder },
    extraGenreIds: input.extraGenreIds,
    platformIds: input.platformIds,
  };
}

/** Crea el juego con sus plataformas y géneros extra en una transacción. */
export async function createGame(input: GameInput): Promise<GameRecord> {
  const { game, extraGenreIds, platformIds } = splitGameInput(input);

  const created = await db.transaction(async (tx) => {
    const row = await tx.orm.public.Game.create(game);
    await tx.orm.public.GamePlatform.createAll(platformIds.map((platformId) => ({ gameId: row.id, platformId })));

    if (extraGenreIds.length > 0) {
      await tx.orm.public.GameGenre.createAll(extraGenreIds.map((genreId) => ({ gameId: row.id, genreId })));
    }

    return row;
  });

  return findGameOrThrow(created.id);
}

/** Actualiza el juego y reemplaza sus plataformas y géneros extra. */
export async function updateGame(id: string, input: GameInput): Promise<GameRecord> {
  if (!isUuid(id)) throw new RecordNotFoundError(GAME_NOT_FOUND);
  const { game, extraGenreIds, platformIds } = splitGameInput(input);

  await db.transaction(async (tx) => {
    const updated = await tx.orm.public.Game.where({ id }).update(game);

    if (!updated) throw new RecordNotFoundError(GAME_NOT_FOUND);

    await tx.orm.public.GamePlatform.where({ gameId: id }).deleteAll();
    await tx.orm.public.GamePlatform.createAll(platformIds.map((platformId) => ({ gameId: id, platformId })));
    await tx.orm.public.GameGenre.where({ gameId: id }).deleteAll();

    if (extraGenreIds.length > 0) {
      await tx.orm.public.GameGenre.createAll(extraGenreIds.map((genreId) => ({ gameId: id, genreId })));
    }
  });

  return findGameOrThrow(id);
}

/** Borra el juego con sus fotos. Falla (llave foránea) si ya tiene check-ins. */
export async function deleteGame(id: string): Promise<void> {
  const deleted = isUuid(id) ? await db.orm.public.Game.where({ id }).delete() : null;

  if (!deleted) throw new RecordNotFoundError(GAME_NOT_FOUND);
}

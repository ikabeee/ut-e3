import "server-only";
import { connection } from "next/server";
import type { CatalogOption, CatalogOptionInput } from "@features/games/lib/types";
import { db } from "@shared/lib/prisma/db";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";
import { isUuid } from "@shared/lib/validation";

// CRUD de géneros y plataformas para el panel de administración.

const GENRE_NOT_FOUND = "El género ya no existe.";

const PLATFORM_NOT_FOUND = "La plataforma ya no existe.";

export async function listGenres(): Promise<CatalogOption[]> {
  await connection();

  return db.orm.public.Genre.select("id", "slug", "name")
    .orderBy((genre) => genre.name.asc())
    .all();
}

export async function createGenre(input: CatalogOptionInput): Promise<CatalogOption> {
  return db.orm.public.Genre.select("id", "slug", "name").create(input);
}

export async function updateGenre(id: string, input: CatalogOptionInput): Promise<CatalogOption> {
  const updated = isUuid(id)
    ? await db.orm.public.Genre.select("id", "slug", "name").where({ id }).update(input)
    : null;

  if (!updated) throw new RecordNotFoundError(GENRE_NOT_FOUND);

  return updated;
}

/** Falla (llave foránea) si algún juego usa el género. */
export async function deleteGenre(id: string): Promise<void> {
  const deleted = isUuid(id) ? await db.orm.public.Genre.where({ id }).delete() : null;

  if (!deleted) throw new RecordNotFoundError(GENRE_NOT_FOUND);
}

export async function listPlatforms(): Promise<CatalogOption[]> {
  await connection();

  return db.orm.public.Platform.select("id", "slug", "name")
    .orderBy((platform) => platform.name.asc())
    .all();
}

export async function createPlatform(input: CatalogOptionInput): Promise<CatalogOption> {
  return db.orm.public.Platform.select("id", "slug", "name").create(input);
}

export async function updatePlatform(id: string, input: CatalogOptionInput): Promise<CatalogOption> {
  const updated = isUuid(id)
    ? await db.orm.public.Platform.select("id", "slug", "name").where({ id }).update(input)
    : null;

  if (!updated) throw new RecordNotFoundError(PLATFORM_NOT_FOUND);

  return updated;
}

/** Falla (llave foránea) si algún juego usa la plataforma. */
export async function deletePlatform(id: string): Promise<void> {
  const deleted = isUuid(id) ? await db.orm.public.Platform.where({ id }).delete() : null;

  if (!deleted) throw new RecordNotFoundError(PLATFORM_NOT_FOUND);
}

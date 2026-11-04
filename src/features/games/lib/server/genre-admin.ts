import "server-only";
import type { AdminGenre } from "@features/games/lib/types";
import { recordAudit } from "@shared/lib/server/audit-log";
import { isUniqueViolation } from "@shared/lib/server/database-errors";
import { getPrisma } from "@shared/lib/server/prisma";

export type GenreChange = { name: string; slug: string };

export type GenreWriteResult = { status: "saved" | "taken" | "notFound" };

export type GenreDeleteResult = { status: "deleted" | "hasGames" | "notFound" };

const ENTITY_TYPE = "genre";

export async function listAdminGenres(): Promise<AdminGenre[]> {
  const genres = await getPrisma().genre.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, _count: { select: { games: true } } },
  });

  return genres.map(({ _count, ...genre }) => ({ ...genre, gameCount: _count.games }));
}

/** A new genre of the catalog (RF-72). Its name and its slug are unique. */
export async function createGenre(actorId: string, change: GenreChange): Promise<GenreWriteResult> {
  try {
    await getPrisma().$transaction(async (transaction) => {
      const genre = await transaction.genre.create({ data: change, select: { id: true } });

      await recordAudit(transaction, {
        actorId,
        action: "genre.create",
        entityType: ENTITY_TYPE,
        entityId: genre.id,
        detail: change,
      });
    });

    return { status: "saved" };
  } catch (cause) {
    if (isUniqueViolation(cause)) return { status: "taken" };

    throw cause;
  }
}

export async function renameGenre(actorId: string, id: string, change: GenreChange): Promise<GenreWriteResult> {
  try {
    return await getPrisma().$transaction(async (transaction): Promise<GenreWriteResult> => {
      const { count } = await transaction.genre.updateMany({ where: { id }, data: change });

      if (count === 0) return { status: "notFound" };

      await recordAudit(transaction, {
        actorId,
        action: "genre.rename",
        entityType: ENTITY_TYPE,
        entityId: id,
        detail: change,
      });

      return { status: "saved" };
    });
  } catch (cause) {
    if (isUniqueViolation(cause)) return { status: "taken" };

    throw cause;
  }
}

/**
 * Deletes a genre without games. The foreign key of `games.genre_id` is `ON DELETE RESTRICT`, so the database refuses
 * it too if a stand assigns the genre between the count and the delete (RF-72).
 */
export async function deleteGenre(actorId: string, id: string): Promise<GenreDeleteResult> {
  try {
    return await getPrisma().$transaction(async (transaction): Promise<GenreDeleteResult> => {
      const genre = await transaction.genre.findUnique({
        where: { id },
        select: { name: true, slug: true, _count: { select: { games: true } } },
      });

      if (!genre) return { status: "notFound" };

      if (genre._count.games > 0) return { status: "hasGames" };

      await transaction.genre.delete({ where: { id } });
      await recordAudit(transaction, {
        actorId,
        action: "genre.delete",
        entityType: ENTITY_TYPE,
        entityId: id,
        detail: { name: genre.name, slug: genre.slug },
      });

      return { status: "deleted" };
    });
  } catch (cause) {
    if (isForeignKeyViolation(cause)) return { status: "hasGames" };

    throw cause;
  }
}

function isForeignKeyViolation(cause: unknown): boolean {
  return cause instanceof Error && /foreign key|P2003/i.test(`${cause.message} ${"code" in cause ? cause.code : ""}`);
}

import "server-only";
import type { GameRepository } from "@features/games/lib/game-repository";
import { toGame, type GameRow } from "@features/games/lib/game-mapping";
import type { Game } from "@features/games/lib/types";

const getDb = async () => (await import("@shared/lib/prisma/db")).db;

/**
 * Juegos con portada, con su equipo (y el número de integrantes), su género principal, sus
 * plataformas y sus fotos. Los juegos sin portada no se muestran en el sitio.
 */
function publishedGames(db: Awaited<ReturnType<typeof getDb>>) {
  return db.orm.public.Game.select("slug", "name", "description", "about", "players", "itchioUrl")
    .where((game) => game.images.some((image) => image.isCover.eq(true)))
    .include("team", (team) => team.select("name", "standCode").include("members", (members) => members.count()))
    .include("genre", (genre) => genre.select("name"))
    .include("platforms", (platforms) => platforms.include("platform", (platform) => platform.select("name")))
    .include("images", (images) =>
      images
        .select("imageUrl", "altText", "cropPosition", "isCover", "sortOrder")
        .orderBy((image) => image.sortOrder.asc()),
    );
}

function toGames(rows: readonly GameRow[]): Game[] {
  return rows.flatMap((row) => {
    const game = toGame(row);

    return game ? [game] : [];
  });
}

/**
 * `GameRepository` sobre PostgreSQL (Prisma). Las funciones de
 * `games-queries.ts` lo llaman dentro de `"use cache"`, así que no usa `connection()`.
 */
export const prismaGameRepository: GameRepository = {
  async listGames() {
    const db = await getDb();

    const rows = await publishedGames(db)
      .orderBy([(game) => game.sortOrder.asc(), (game) => game.name.asc()])
      .all();

    return toGames(rows);
  },

  async findGameBySlug(slug) {
    const db = await getDb();

    const row = await publishedGames(db)
      .where((game) => game.slug.eq(slug))
      .first();

    return row ? toGame(row) : null;
  },
};

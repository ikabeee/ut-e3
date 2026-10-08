import "server-only";
import type { ResultType } from "@prisma/orm-postgres/components/runtime";
import { connection } from "next/server";
import { db } from "@/shared/infrastructure/prisma/db";
import type { Game } from "../domain/game";
import type { GameRepository } from "../domain/game-repository";

const publishedGames = () =>
  db.orm.public.Game.where({ published: true }).include("team");

type GameRow = ResultType<ReturnType<typeof publishedGames>>;

function toDomain(row: GameRow): Game {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    genre: row.genre,
    engine: row.engine,
    coverUrl: row.coverUrl,
    playUrl: row.playUrl,
    repoUrl: row.repoUrl,
    standNumber: row.standNumber,
    team: { slug: row.team.slug, name: row.team.name },
  };
}

export const prismaGameRepository: GameRepository = {
  async listPublished() {
    await connection();
    const rows = await publishedGames()
      .orderBy((game) => game.title.asc())
      .all();
    return rows.map(toDomain);
  },

  async findPublishedBySlug(slug) {
    await connection();
    const row = await publishedGames().where({ slug }).first();
    return row ? toDomain(row) : null;
  },
};

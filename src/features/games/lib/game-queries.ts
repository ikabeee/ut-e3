import "server-only";
import type { ResultType } from "@prisma/orm-postgres/components/runtime";
import { connection } from "next/server";
import { db } from "@/shared/lib/prisma/db";
import type { Game } from "./types";

const publishedGames = () =>
  db.orm.public.Game.where({ published: true }).include("team");

type GameRow = ResultType<ReturnType<typeof publishedGames>>;

function toGame(row: GameRow): Game {
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

export async function listPublishedGames(): Promise<Game[]> {
  await connection();
  const rows = await publishedGames()
    .orderBy((game) => game.title.asc())
    .all();
  return rows.map(toGame);
}

export async function getPublishedGameBySlug(slug: string): Promise<Game | null> {
  await connection();
  const row = await publishedGames().where({ slug }).first();
  return row ? toGame(row) : null;
}

import "server-only";
import { connection } from "next/server";
import { db } from "@/shared/infrastructure/prisma/db";
import type { TeamRepository } from "../domain/team-repository";

export const prismaTeamRepository: TeamRepository = {
  async listAll() {
    await connection();
    const rows = await db.orm.public.Team.include("games", (games) =>
      games.where({ published: true }).count(),
    )
      .orderBy((team) => team.name.asc())
      .all();

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      group: row.group,
      members: row.members,
      gameCount: row.games,
    }));
  },
};

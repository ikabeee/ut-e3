import "server-only";
import { connection } from "next/server";
import type { TeamPortalData } from "@features/teams/lib/types";
import { TRAFFIC_WINDOW_MINUTES } from "@features/visitors/lib/visitor-rules";
import { db } from "@shared/lib/prisma/db";
import { isUuid } from "@shared/lib/validation";

/**
 * Consulta los datos del stand del equipo autenticado, su juego asociado, integrantes y
 * estadísticas de check-ins en vivo.
 */
export async function getTeamPortalData(teamId: string): Promise<TeamPortalData | null> {
  await connection();

  if (!isUuid(teamId)) return null;

  const team = await db.orm.public.Team.select("id", "name", "standCode")
    .where({ id: teamId })
    .include("game", (game) => game.select("id", "name", "slug"))
    .include("members", (members) =>
      members
        .select("id", "fullName", "email", "groupName", "isLeader")
        .orderBy([(m) => m.sortOrder.asc(), (m) => m.fullName.asc()]),
    )
    .first();

  if (!team) return null;

  let totalCheckIns = 0;
  let recentCheckIns = 0;

  if (team.game) {
    const since = new Date(Date.now() - TRAFFIC_WINDOW_MINUTES * 60_000).toISOString();

    const [totalRows, recentRows] = await Promise.all([
      db.orm.public.CheckIn.select("id").where({ gameId: team.game.id }).all(),
      db.orm.public.CheckIn.select("id")
        .where({ gameId: team.game.id })
        .where((checkIn) => checkIn.scannedAt.gt(since))
        .all(),
    ]);

    totalCheckIns = totalRows.length;
    recentCheckIns = recentRows.length;
  }

  return {
    id: team.id,
    name: team.name,
    standCode: team.standCode,
    game: team.game ? { id: team.game.id, name: team.game.name, slug: team.game.slug } : null,
    members: team.members.map((member) => ({
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      groupName: member.groupName,
      isLeader: member.isLeader,
    })),
    totalCheckIns,
    recentCheckIns,
  };
}

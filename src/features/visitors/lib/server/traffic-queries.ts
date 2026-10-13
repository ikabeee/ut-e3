import "server-only";
import { cacheLife } from "next/cache";
import type { StandTrafficReport } from "@features/visitors/lib/types";
import { TRAFFIC_WINDOW_MINUTES } from "@features/visitors/lib/visitor-rules";
import { db } from "@shared/lib/prisma/db";

/**
 * Afluencia de cada stand: visitantes que probaron su juego en los últimos 15 minutos (usa el
 * índice `(game_id, scanned_at)`). Se cachea 30 segundos para que todos los visitantes del
 * croquis compartan una sola consulta; por ser tan corta, Next.js la resuelve al pedirla y no
 * en el build.
 */
export async function getStandTraffic(): Promise<StandTrafficReport> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 60 });

  const since = new Date(Date.now() - TRAFFIC_WINDOW_MINUTES * 60_000).toISOString();

  const teams = await db.orm.public.Team.select("standCode")
    .where((team) => team.standCode.isNotNull())
    .include("game", (game) =>
      game
        .select("id")
        .include("checkIns", (checkIns) => checkIns.where((checkIn) => checkIn.scannedAt.gt(since)).count()),
    )
    .orderBy((team) => team.standCode.asc())
    .all();

  return {
    windowMinutes: TRAFFIC_WINDOW_MINUTES,
    stands: teams.flatMap(({ standCode, game }) =>
      standCode && game ? [{ standCode, recentCheckIns: game.checkIns }] : [],
    ),
  };
}

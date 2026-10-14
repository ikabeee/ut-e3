import "server-only";
import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import type { TeamScanResult } from "@features/teams/lib/types";
import { recordCheckIns } from "@features/visitors/lib/server/check-ins-queries";
import { extractVisitorToken } from "@features/visitors/lib/visitor-rules";
import { ActionRuleError } from "@shared/lib/action-rule-error";
import { db } from "@shared/lib/prisma/db";
import { hashSecret } from "@shared/lib/server/secrets";

/**
 * Registra un check-in de visitante para el stand y juego del equipo autenticado.
 */
export async function recordTeamVisitorCheckIn(teamId: string, scannedInput: string): Promise<TeamScanResult> {
  await connection();

  const team = await db.orm.public.Team.select("id")
    .where({ id: teamId })
    .include("game", (game) => game.select("id", "name"))
    .first();

  if (!team?.game) {
    throw new ActionRuleError("El equipo no tiene un juego asignado para registrar visitas.");
  }

  const token = extractVisitorToken(scannedInput);

  if (!token) {
    return { status: "unknown" };
  }

  const checkInId = randomUUID();

  const results = await recordCheckIns(team.game.id, [
    {
      id: checkInId,
      token,
      scannedAt: new Date().toISOString(),
    },
  ]);

  const result = results[0];
  const status = result?.status ?? "unknown";

  let gamertag: string | undefined;

  if (status !== "unknown") {
    const visitor = await db.orm.public.Visitor.select("gamertag")
      .where({ qrTokenHash: hashSecret(token) })
      .first();

    gamertag = visitor?.gamertag;
  }

  return {
    status,
    gamertag,
    gameName: team.game.name,
  };
}

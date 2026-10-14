"use server";

import { recordTeamVisitorCheckIn } from "@features/teams/lib/server/team-scanner-queries";
import type { TeamScanResult } from "@features/teams/lib/types";
import { actionError, type ActionResult } from "@shared/lib/action-result";
import { runServerAction } from "@shared/lib/server/server-action";
import { getAuthSession } from "@shared/lib/server/session";

/**
 * Server Action para registrar un código QR escaneado en el portal del stand.
 */
export async function scanVisitorQrAction(scannedInput: string): Promise<ActionResult<TeamScanResult>> {
  const session = await getAuthSession();

  if (session?.role !== "team" || !session.teamId) {
    return actionError("No tienes autorización para registrar visitas en este stand.");
  }

  return runServerAction(
    async () => {
      return recordTeamVisitorCheckIn(session.teamId!, scannedInput);
    },
    { refreshPage: true },
  );
}

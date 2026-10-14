"use server";

import { GAMES_CACHE_TAG } from "@features/games/lib/games-cache";
import { parseAddMemberByLeaderInput, parseUpdateGameByLeaderInput } from "@features/teams/lib/team-validation";
import { ActionRuleError } from "@shared/lib/action-rule-error";
import { actionError, type ActionResult } from "@shared/lib/action-result";
import { runServerAction } from "@shared/lib/server/server-action";
import { getAuthSession } from "@shared/lib/server/session";
import type { RawInput } from "@shared/lib/validation";

async function getAuthenticatedTeamId(): Promise<string> {
  const session = await getAuthSession();

  if (session?.role !== "team" || !session.teamId) {
    throw new ActionRuleError("No tienes autorización para administrar este equipo.");
  }

  return session.teamId;
}

const portalOptions = { invalidateTags: [GAMES_CACHE_TAG], refreshPage: true };

const getPortalQueries = async () => import("@features/teams/lib/server/team-portal-queries");

/** Acción para que el líder agregue un integrante a su equipo. */
export async function addMemberByLeaderAction(input: RawInput): Promise<ActionResult<void>> {
  try {
    const teamId = await getAuthenticatedTeamId();
    const parsed = parseAddMemberByLeaderInput(input);
    const { addMemberByLeader } = await getPortalQueries();

    return runServerAction(() => addMemberByLeader(teamId, parsed), portalOptions);
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Error al agregar integrante.");
  }
}

/** Acción para que el líder elimine a un integrante de su equipo. */
export async function deleteMemberByLeaderAction(memberId: string): Promise<ActionResult<void>> {
  try {
    const teamId = await getAuthenticatedTeamId();
    const { deleteMemberByLeader } = await getPortalQueries();

    return runServerAction(() => deleteMemberByLeader(teamId, memberId), portalOptions);
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Error al eliminar integrante.");
  }
}

/** Acción para que el líder actualice la descripción y enlace del juego. */
export async function updateGameByLeaderAction(input: RawInput): Promise<ActionResult<void>> {
  try {
    const teamId = await getAuthenticatedTeamId();
    const parsed = parseUpdateGameByLeaderInput(input);
    const { updateGameByLeader } = await getPortalQueries();

    return runServerAction(() => updateGameByLeader(teamId, parsed), portalOptions);
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Error al actualizar información del juego.");
  }
}

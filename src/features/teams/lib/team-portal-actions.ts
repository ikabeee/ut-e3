"use server";

import { GAMES_CACHE_TAG } from "@features/games/lib/games-cache";
import {
  parseAddMemberByLeaderInput,
  parseCreateGameByLeaderInput,
  parseUpdateGameByLeaderInput,
} from "@features/teams/lib/team-validation";
import type {
  AddMemberByLeaderInput,
  CreateGameByLeaderInput,
  UpdateGameByLeaderInput,
} from "@features/teams/lib/types";
import { ActionRuleError } from "@shared/lib/action-rule-error";
import { actionError, type ActionResult } from "@shared/lib/action-result";
import { runServerAction, type ServerActionDependencies } from "@shared/lib/server/server-action";
import { getAuthSession, type SessionPayload } from "@shared/lib/server/session";
import { ValidationError, type RawInput } from "@shared/lib/validation";

export interface TeamPortalActionDependencies {
  getAuthSession?: () => Promise<SessionPayload | null>;
  createGameByLeader?: (teamId: string, input: CreateGameByLeaderInput) => Promise<void>;
  updateGameByLeader?: (teamId: string, input: UpdateGameByLeaderInput) => Promise<void>;
  addMemberByLeader?: (teamId: string, input: AddMemberByLeaderInput) => Promise<void>;
  deleteMemberByLeader?: (teamId: string, memberId: string) => Promise<void>;
  cache?: ServerActionDependencies;
}

async function getAuthenticatedTeamId(
  readSession: () => Promise<SessionPayload | null> = getAuthSession,
): Promise<string> {
  const session = await readSession();

  if (session?.role !== "team" || !session.teamId) {
    throw new ActionRuleError("No tienes autorización para administrar este equipo.");
  }

  return session.teamId;
}

const portalOptions = { invalidateTags: [GAMES_CACHE_TAG], refreshPage: true };

const getPortalQueries = async () => import("@features/teams/lib/server/team-portal-queries");

/** Acción para que el líder agregue un integrante a su equipo. */
export async function addMemberByLeaderAction(
  input: RawInput,
  deps?: TeamPortalActionDependencies,
): Promise<ActionResult<void>> {
  try {
    const teamId = await getAuthenticatedTeamId(deps?.getAuthSession);
    const parsed = parseAddMemberByLeaderInput(input);
    const addMember = deps?.addMemberByLeader ?? (await getPortalQueries()).addMemberByLeader;

    return runServerAction(() => addMember(teamId, parsed), portalOptions, deps?.cache);
  } catch (error) {
    if (error instanceof ValidationError) {
      return actionError(error.message, error.fieldErrors);
    }

    return actionError(error instanceof Error ? error.message : "Error al agregar integrante.");
  }
}

/** Acción para que el líder elimine a un integrante de su equipo. */
export async function deleteMemberByLeaderAction(
  memberId: string,
  deps?: TeamPortalActionDependencies,
): Promise<ActionResult<void>> {
  try {
    const teamId = await getAuthenticatedTeamId(deps?.getAuthSession);
    const deleteMember = deps?.deleteMemberByLeader ?? (await getPortalQueries()).deleteMemberByLeader;

    return runServerAction(() => deleteMember(teamId, memberId), portalOptions, deps?.cache);
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Error al eliminar integrante.");
  }
}

/** Acción para que el líder dé de alta por primera vez el juego de su equipo. */
export async function createGameByLeaderAction(
  input: RawInput,
  deps?: TeamPortalActionDependencies,
): Promise<ActionResult<void>> {
  try {
    const teamId = await getAuthenticatedTeamId(deps?.getAuthSession);
    const parsed = parseCreateGameByLeaderInput(input);
    const createGame = deps?.createGameByLeader ?? (await getPortalQueries()).createGameByLeader;

    return runServerAction(() => createGame(teamId, parsed), portalOptions, deps?.cache);
  } catch (error) {
    if (error instanceof ValidationError) {
      return actionError(error.message, error.fieldErrors);
    }

    return actionError(error instanceof Error ? error.message : "Error al registrar el juego.");
  }
}

/** Acción para que el líder actualice la descripción y enlace del juego. */
export async function updateGameByLeaderAction(
  input: RawInput,
  deps?: TeamPortalActionDependencies,
): Promise<ActionResult<void>> {
  try {
    const teamId = await getAuthenticatedTeamId(deps?.getAuthSession);
    const parsed = parseUpdateGameByLeaderInput(input);
    const updateGame = deps?.updateGameByLeader ?? (await getPortalQueries()).updateGameByLeader;

    return runServerAction(() => updateGame(teamId, parsed), portalOptions, deps?.cache);
  } catch (error) {
    if (error instanceof ValidationError) {
      return actionError(error.message, error.fieldErrors);
    }

    return actionError(error instanceof Error ? error.message : "Error al actualizar información del juego.");
  }
}

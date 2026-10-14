"use server";

import { GAMES_CACHE_TAG } from "@features/games/lib/server/games-queries";
import {
  parseCreateTeamInput,
  parseCreateTeamLeaderInput,
  parseTeamInput,
  parseTeamMemberInput,
} from "@features/teams/lib/team-validation";
import {
  addTeamMember,
  createTeam,
  createTeamLeader,
  deleteTeam,
  deleteTeamMember,
  rotateTeamScannerKey,
  updateTeam,
  updateTeamMember,
} from "@features/teams/lib/server/teams-queries";
import { runAdminAction } from "@shared/lib/server/admin-action";
import type { RawInput } from "@shared/lib/validation";

// Server Actions del panel de administración para equipos e integrantes. Todas comprueban
// permisos (runAdminAction) y, como el nombre del equipo, su stand y sus integrantes se
// muestran en el catálogo, invalidan la caché de los juegos.

const TEAM_CONSTRAINT_MESSAGES = {
  team_name_key: "Ya existe un equipo con ese nombre.",
  team_stand_code_key: "Ese stand ya está asignado a otro equipo.",
  team_stand_code_format: "El stand debe ser A1-A9 o B1-B9.",
  team_member_one_leader: "El equipo ya tiene un líder.",
  team_member_email_key: "Ya existe una cuenta registrada con ese correo electrónico.",
  check_in_game_id_fkey: "No se puede borrar: el juego del equipo ya tiene check-ins.",
  team_member_team_id_fkey: "El equipo ya no existe.",
};

const options = { invalidateTags: [GAMES_CACHE_TAG], constraintMessages: TEAM_CONSTRAINT_MESSAGES };

/** Crea un equipo (y opcionalmente a su líder inicial). La respuesta trae la llave del escáner. */
export async function createTeamAction(input: RawInput) {
  return runAdminAction(() => createTeam(parseCreateTeamInput(input)), options);
}

export async function updateTeamAction(teamId: string, input: RawInput) {
  return runAdminAction(() => updateTeam(teamId, parseTeamInput(input)), options);
}

export async function deleteTeamAction(teamId: string) {
  return runAdminAction(() => deleteTeam(teamId), options);
}

/** Genera una llave de escáner nueva para el stand del equipo (la anterior deja de servir). */
export async function rotateTeamScannerKeyAction(teamId: string) {
  return runAdminAction(() => rotateTeamScannerKey(teamId), { constraintMessages: TEAM_CONSTRAINT_MESSAGES });
}

export async function addTeamMemberAction(teamId: string, input: RawInput) {
  return runAdminAction(() => addTeamMember(teamId, parseTeamMemberInput(input)), options);
}

export async function updateTeamMemberAction(memberId: string, input: RawInput) {
  return runAdminAction(() => updateTeamMember(memberId, parseTeamMemberInput(input)), options);
}

export async function deleteTeamMemberAction(memberId: string) {
  return runAdminAction(() => deleteTeamMember(memberId), options);
}

/** Crea o actualiza el usuario líder de un equipo y envía correo de confirmación. */
export async function createTeamLeaderAction(teamId: string, input: RawInput) {
  return runAdminAction(() => createTeamLeader(teamId, parseCreateTeamLeaderInput(input)), options);
}

import "server-only";
import { connection } from "next/server";
import type {
  AddMemberByLeaderInput,
  CreateGameByLeaderInput,
  TeamPortalData,
  UpdateGameByLeaderInput,
} from "@features/teams/lib/types";
import { TRAFFIC_WINDOW_MINUTES } from "@features/visitors/lib/visitor-rules";
import { db } from "@shared/lib/prisma/db";
import { ActionRuleError } from "@shared/lib/action-rule-error";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";
import { generateSecret } from "@shared/lib/server/secrets";
import { isUuid } from "@shared/lib/validation";

/**
 * Consulta los datos del stand del equipo autenticado, su juego asociado, integrantes y
 * estadísticas de check-ins en vivo.
 */
export async function getTeamPortalData(teamId: string): Promise<TeamPortalData | null> {
  await connection();

  if (!isUuid(teamId)) return null;

  const team = await db.orm.public.Team.select("id", "name", "standCode", "scannerKey")
    .where({ id: teamId })
    .include("game", (game) => game.select("id", "name", "slug", "description", "itchioUrl"))
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
    scannerKey: team.scannerKey ?? null,
    game: team.game
      ? {
          id: team.game.id,
          name: team.game.name,
          slug: team.game.slug,
          description: team.game.description,
          itchioUrl: team.game.itchioUrl,
        }
      : null,
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

/** Agrega un integrante al equipo por parte de su líder. */
export async function addMemberByLeader(teamId: string, input: AddMemberByLeaderInput): Promise<void> {
  if (!isUuid(teamId)) throw new RecordNotFoundError("El equipo no existe.");

  await connection();

  const existingMembers = await db.orm.public.TeamMember.select("sortOrder").where({ teamId }).all();
  const nextSortOrder = existingMembers.length > 0 ? Math.max(...existingMembers.map((m) => m.sortOrder)) + 1 : 0;
  const email = `member.${Date.now()}.${generateSecret().slice(0, 8)}@ute3.edu.mx`;

  await db.orm.public.TeamMember.create({
    teamId,
    fullName: input.fullName,
    groupName: input.groupName,
    isLeader: false,
    sortOrder: nextSortOrder,
    email,
    passwordHash: "",
    isConfirmed: true,
  });
}

/** Elimina un integrante del equipo por parte de su líder (no puede eliminar al líder). */
export async function deleteMemberByLeader(teamId: string, memberId: string): Promise<void> {
  if (!isUuid(teamId) || !isUuid(memberId)) throw new RecordNotFoundError("Registro no encontrado.");

  await connection();

  const member = await db.orm.public.TeamMember.select("teamId", "isLeader").where({ id: memberId }).first();

  if (!member || member.teamId !== teamId) {
    throw new ActionRuleError("No tienes permiso para modificar a los integrantes de otro equipo.");
  }

  if (member.isLeader) {
    throw new ActionRuleError("No puedes eliminar la cuenta del líder del equipo.");
  }

  await db.orm.public.TeamMember.where({ id: memberId }).delete();
}

/** Da de alta el videojuego del equipo por parte de su líder. */
export async function createGameByLeader(teamId: string, input: CreateGameByLeaderInput): Promise<void> {
  if (!isUuid(teamId)) throw new RecordNotFoundError("El equipo no existe.");

  await connection();

  const existingGame = await db.orm.public.Game.select("id").where({ teamId }).first();

  if (existingGame) {
    throw new ActionRuleError("Tu equipo ya tiene un videojuego registrado.");
  }

  let genreId = input.genreId;

  if (!genreId || !isUuid(genreId)) {
    const defaultGenre = await db.orm.public.Genre.select("id").first();

    if (!defaultGenre) throw new ActionRuleError("Aún no hay categorías de juego registradas.");

    genreId = defaultGenre.id;
  }

  const baseSlug = input.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    // eslint-disable-next-line sonarjs/super-linear-regex -- harmless on slug of length <= 80
    .replace(/-+$/, "")
    .slice(0, 60);

  const slug = baseSlug.length >= 3 ? baseSlug : `juego-${Date.now().toString().slice(-6)}`;

  await db.orm.public.Game.create({
    teamId,
    name: input.name,
    description: input.description,
    slug,
    genreId,
    players: input.players && input.players >= 1 && input.players <= 16 ? input.players : 1,
    itchioUrl: input.itchioUrl || null,
  });
}

/** Actualiza la descripción y enlace del juego por parte de su líder. */
export async function updateGameByLeader(teamId: string, input: UpdateGameByLeaderInput): Promise<void> {
  if (!isUuid(teamId)) throw new RecordNotFoundError("El equipo no existe.");

  await connection();

  const game = await db.orm.public.Game.select("id").where({ teamId }).first();

  if (!game) {
    throw new ActionRuleError("Tu equipo aún no tiene un videojuego registrado.");
  }

  await db.orm.public.Game.where({ id: game.id }).update({
    description: input.description,
    itchioUrl: input.itchioUrl ?? null,
  });
}

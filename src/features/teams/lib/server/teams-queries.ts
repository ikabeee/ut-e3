import "server-only";
import { connection } from "next/server";
import type { Team, TeamInput, TeamMember, TeamMemberInput, TeamWithScannerKey } from "@features/teams/lib/types";
import { db } from "@shared/lib/prisma/db";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";
import { generateSecret, hashSecret } from "@shared/lib/server/secrets";
import { isUuid } from "@shared/lib/validation";

// CRUD de equipos e integrantes para el panel de administración. Las Server Actions de
// `teams-actions.ts` validan los datos y comprueban permisos antes de llamar a estas funciones.

const TEAM_NOT_FOUND = "El equipo ya no existe.";

const MEMBER_NOT_FOUND = "El integrante ya no existe.";

function teamsWithDetails() {
  return db.orm.public.Team.select("id", "name", "standCode")
    .include("members", (members) =>
      members
        .select("id", "teamId", "fullName", "groupName", "isLeader", "sortOrder")
        .orderBy([(member) => member.sortOrder.asc(), (member) => member.fullName.asc()]),
    )
    .include("game", (game) => game.select("slug"));
}

type TeamRow = Awaited<ReturnType<ReturnType<typeof teamsWithDetails>["first"]>>;

function toTeam(row: NonNullable<TeamRow>): Team {
  return {
    id: row.id,
    name: row.name,
    standCode: row.standCode,
    members: row.members.map((member): TeamMember => ({ ...member })),
    gameSlug: row.game?.slug ?? null,
  };
}

async function findTeamOrThrow(id: string): Promise<Team> {
  const row = isUuid(id) ? await teamsWithDetails().where({ id }).first() : null;

  if (!row) throw new RecordNotFoundError(TEAM_NOT_FOUND);

  return toTeam(row);
}

export async function listTeams(): Promise<Team[]> {
  await connection();

  const rows = await teamsWithDetails()
    .orderBy((team) => team.name.asc())
    .all();

  return rows.map(toTeam);
}

export async function getTeam(id: string): Promise<Team | null> {
  await connection();

  if (!isUuid(id)) return null;
  const row = await teamsWithDetails().where({ id }).first();

  return row ? toTeam(row) : null;
}

/** Crea el equipo con una llave de escáner nueva (sólo se devuelve esta vez). */
export async function createTeam(input: TeamInput): Promise<TeamWithScannerKey> {
  const scannerKey = generateSecret();
  const created = await db.orm.public.Team.create({ ...input, scannerKeyHash: hashSecret(scannerKey) });

  return { team: await findTeamOrThrow(created.id), scannerKey };
}

export async function updateTeam(id: string, input: TeamInput): Promise<Team> {
  if (!isUuid(id)) throw new RecordNotFoundError(TEAM_NOT_FOUND);
  const updated = await db.orm.public.Team.where({ id }).update(input);

  if (!updated) throw new RecordNotFoundError(TEAM_NOT_FOUND);

  return findTeamOrThrow(id);
}

/** Borra el equipo con sus integrantes y su juego. Falla si el juego ya tiene check-ins. */
export async function deleteTeam(id: string): Promise<void> {
  const deleted = isUuid(id) ? await db.orm.public.Team.where({ id }).delete() : null;

  if (!deleted) throw new RecordNotFoundError(TEAM_NOT_FOUND);
}

/** Genera una llave de escáner nueva; la anterior deja de funcionar. */
export async function rotateTeamScannerKey(id: string): Promise<TeamWithScannerKey> {
  if (!isUuid(id)) throw new RecordNotFoundError(TEAM_NOT_FOUND);
  const scannerKey = generateSecret();
  const updated = await db.orm.public.Team.where({ id }).update({ scannerKeyHash: hashSecret(scannerKey) });

  if (!updated) throw new RecordNotFoundError(TEAM_NOT_FOUND);

  return { team: await findTeamOrThrow(id), scannerKey };
}

export async function addTeamMember(teamId: string, input: TeamMemberInput): Promise<Team> {
  if (!isUuid(teamId)) throw new RecordNotFoundError(TEAM_NOT_FOUND);
  await db.transaction(async (tx) => {
    // Un solo líder por equipo: el nuevo líder reemplaza al anterior.
    if (input.isLeader) {
      await tx.orm.public.TeamMember.where({ teamId, isLeader: true }).updateAll({ isLeader: false });
    }

    await tx.orm.public.TeamMember.create({ ...input, teamId });
  });

  return findTeamOrThrow(teamId);
}

export async function updateTeamMember(id: string, input: TeamMemberInput): Promise<Team> {
  const member = isUuid(id) ? await db.orm.public.TeamMember.select("teamId").where({ id }).first() : null;

  if (!member) throw new RecordNotFoundError(MEMBER_NOT_FOUND);

  await db.transaction(async (tx) => {
    if (input.isLeader) {
      await tx.orm.public.TeamMember.where((row) => row.teamId.eq(member.teamId))
        .where((row) => row.id.neq(id))
        .updateAll({ isLeader: false });
    }

    await tx.orm.public.TeamMember.where({ id }).update(input);
  });

  return findTeamOrThrow(member.teamId);
}

export async function deleteTeamMember(id: string): Promise<Team> {
  const deleted = isUuid(id) ? await db.orm.public.TeamMember.where({ id }).delete() : null;

  if (!deleted) throw new RecordNotFoundError(MEMBER_NOT_FOUND);

  return findTeamOrThrow(deleted.teamId);
}

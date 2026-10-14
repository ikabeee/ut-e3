import { AdminActionButton } from "@features/admin/components/admin-action-button";
import { AdminActionForm } from "@features/admin/components/admin-action-form";
import { AdminDisclosure } from "@features/admin/components/admin-disclosure";
import { AdminPanel } from "@features/admin/components/admin-panel";
import { RotateScannerKeyButton } from "@features/admin/components/rotate-scanner-key-button";
import { TeamFields } from "@features/admin/components/team-fields";
import { TeamLeaderFields } from "@features/admin/components/team-leader-fields";
import { TeamMemberFields } from "@features/admin/components/team-member-fields";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import {
  addTeamMemberAction,
  createTeamLeaderAction,
  deleteTeamAction,
  deleteTeamMemberAction,
  updateTeamAction,
} from "@features/teams/lib/teams-actions";
import type { Team } from "@features/teams/lib/types";

interface TeamCardProps {
  team: Team;
}

/** Un equipo en el panel: datos, integrantes, llave del escáner y borrado. */
export function TeamCard({ team }: Readonly<TeamCardProps>) {
  const copy = ADMIN_COPY.teams;
  const leader = team.members.find((member) => member.isLeader);

  return (
    <AdminPanel title={team.name} hint={`${team.standCode ?? copy.noStand} · ${copy.game(team.gameSlug)}`}>
      <AdminDisclosure label={ADMIN_COPY.common.edit}>
        <AdminActionForm
          action={updateTeamAction.bind(null, team.id)}
          submitLabel={ADMIN_COPY.common.save}
          successMessage={ADMIN_COPY.common.saved}
        >
          <TeamFields team={team} />
        </AdminActionForm>
      </AdminDisclosure>

      {/* Sección del Usuario Líder (creado exclusivamente por sysadmin) */}
      <div className="border-t border-border pt-4">
        {leader ? (
          <div className="flex flex-col gap-1 rounded border border-border bg-surface/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Líder del equipo: {leader.fullName}</span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-semibold ${
                  leader.isConfirmed ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                }`}
              >
                {leader.isConfirmed ? "Cuenta confirmada" : "Confirmación pendiente"}
              </span>
            </div>
            <p className="m-0 text-xs text-muted">
              Correo: <strong className="text-foreground">{leader.email}</strong> · Grupo: {leader.groupName}
            </p>
            <div className="mt-2">
              <AdminDisclosure label="Cambiar usuario líder">
                <AdminActionForm
                  action={createTeamLeaderAction.bind(null, team.id)}
                  submitLabel="Actualizar líder y enviar correo"
                  successMessage="Líder actualizado y correo de confirmación enviado."
                  resetOnSuccess
                >
                  <TeamLeaderFields />
                </AdminActionForm>
              </AdminDisclosure>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded border border-dashed border-border bg-surface/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-warning">Sin usuario líder asignado</span>
            </div>
            <p className="m-0 text-xs text-muted">
              Crea el usuario líder del equipo para habilitar su acceso y que pueda gestionar a sus integrantes.
            </p>
            <AdminDisclosure label="Crear usuario líder">
              <AdminActionForm
                action={createTeamLeaderAction.bind(null, team.id)}
                submitLabel="Crear usuario y enviar correo"
                successMessage="Usuario líder creado y correo de confirmación enviado."
                resetOnSuccess
              >
                <TeamLeaderFields />
              </AdminActionForm>
            </AdminDisclosure>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <h3 className="m-0 type-tiny text-muted">{copy.members}</h3>
        {team.members.length === 0 ? <p className="m-0 text-sm text-muted">{copy.noMembers}</p> : null}
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {team.members.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-3">
              <span>
                {member.fullName} <span className="type-tiny text-muted">· {member.groupName}</span>
                {member.isLeader ? <span className="type-tiny text-accent"> · {copy.leader}</span> : null}
              </span>
              <AdminActionButton
                action={deleteTeamMemberAction.bind(null, member.id)}
                label={copy.removeMember}
                confirmLabel={ADMIN_COPY.common.confirmDelete}
                variant="tertiary"
              />
            </li>
          ))}
        </ul>
        <AdminDisclosure label={copy.addMember}>
          <AdminActionForm
            action={addTeamMemberAction.bind(null, team.id)}
            submitLabel={copy.addMember}
            successMessage={copy.memberAdded}
            resetOnSuccess
          >
            <TeamMemberFields nextSortOrder={team.members.length} />
          </AdminActionForm>
        </AdminDisclosure>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-border pt-4">
        <RotateScannerKeyButton teamId={team.id} />
        <AdminActionButton
          action={deleteTeamAction.bind(null, team.id)}
          label={ADMIN_COPY.common.delete}
          confirmLabel={ADMIN_COPY.common.confirmDelete}
          variant="danger"
        />
      </div>
    </AdminPanel>
  );
}

import { AdminActionButton } from "@features/admin/components/admin-action-button";
import { AdminActionForm } from "@features/admin/components/admin-action-form";
import { AdminDisclosure } from "@features/admin/components/admin-disclosure";
import { AdminPanel } from "@features/admin/components/admin-panel";
import { RotateScannerKeyButton } from "@features/admin/components/rotate-scanner-key-button";
import { TeamFields } from "@features/admin/components/team-fields";
import { TeamMemberFields } from "@features/admin/components/team-member-fields";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import {
  addTeamMemberAction,
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

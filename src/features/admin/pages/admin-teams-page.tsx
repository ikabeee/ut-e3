import { Suspense } from "react";
import { Persons } from "@gravity-ui/icons";
import { AdminPanel } from "@features/admin/components/admin-panel";
import { AdminShell } from "@features/admin/components/admin-shell";
import { AdminSkeleton } from "@features/admin/components/admin-skeleton";
import { TeamCard } from "@features/admin/components/team-card";
import { TeamCreateForm } from "@features/admin/components/team-create-form";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { buildAdminMetadata } from "@features/admin/lib/admin-metadata";
import { getAdminTeams } from "@features/admin/lib/server/admin-queries";
import { EmptyState } from "@shared/components/empty-state";

export const adminTeamsPageMetadata = buildAdminMetadata("teams");

async function AdminTeamsContent() {
  const teams = await getAdminTeams();

  return (
    <>
      <AdminPanel title={ADMIN_COPY.teams.createTitle}>
        <TeamCreateForm />
      </AdminPanel>
      {teams.length === 0 ? <EmptyState icon={Persons} title={ADMIN_COPY.teams.empty} /> : null}
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </>
  );
}

/** Equipos (`/admin/teams`): alta, stand, integrantes y llave del escáner. */
export function AdminTeamsPage() {
  return (
    <AdminShell current="teams">
      <Suspense fallback={<AdminSkeleton />}>
        <AdminTeamsContent />
      </Suspense>
    </AdminShell>
  );
}

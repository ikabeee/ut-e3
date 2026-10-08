import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingMessage, PageSection } from "@/shared/components";
import { TeamList } from "../components/team-list";
import { listTeams } from "../lib/team-queries";

export const teamsPageMetadata: Metadata = {
  title: "Equipos",
};

async function RegisteredTeams() {
  const teams = await listTeams();
  return <TeamList teams={teams} />;
}

export function TeamsPage() {
  return (
    <PageSection title="Equipos">
      <Suspense fallback={<LoadingMessage message="Cargando equipos..." />}>
        <RegisteredTeams />
      </Suspense>
    </PageSection>
  );
}

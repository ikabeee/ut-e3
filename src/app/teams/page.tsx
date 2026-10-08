import type { Metadata } from "next";
import { Suspense } from "react";
import { TeamList } from "@/modules/teams";
import { listTeams } from "@/modules/teams/server";
import { Container } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Equipos",
};

async function Teams() {
  const teams = await listTeams();
  return <TeamList teams={teams} />;
}

export default function TeamsPage() {
  return (
    <Container>
      <section className="flex flex-col gap-8 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
        <Suspense fallback={<p className="text-zinc-500">Cargando equipos…</p>}>
          <Teams />
        </Suspense>
      </section>
    </Container>
  );
}

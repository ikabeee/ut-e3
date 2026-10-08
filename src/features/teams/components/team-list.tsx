import { EmptyState } from "@/shared/components";
import type { Team } from "../lib/types";
import { TeamCard } from "./team-card";

export function TeamList({ teams }: { teams: Team[] }) {
  if (teams.length === 0) {
    return <EmptyState message="Aún no hay equipos registrados." />;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <li key={team.id} className="flex [&>*]:flex-1">
          <TeamCard team={team} />
        </li>
      ))}
    </ul>
  );
}

import { Spinner } from "@heroui/react";
import { TEAMS_COPY } from "@features/teams/lib/teams-copy";

/** Loading state con spinner para la carga del portal de equipo. */
export function TeamPortalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" color="accent" aria-label={TEAMS_COPY.page.loading} />
    </div>
  );
}

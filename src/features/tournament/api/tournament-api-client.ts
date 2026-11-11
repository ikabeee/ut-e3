import { isTournament } from "@features/tournament/lib/tournament-guards";
import type { Tournament } from "@features/tournament/lib/types";

export const TOURNAMENT_API_PATH = "/api/tournament";

export interface TournamentSnapshot {
  /** `null` until the bracket is generated. */
  tournament: Tournament | null;
  serverNow: number;
}

/** Asks the Route Handler for the current bracket; the answer is never taken from the browser cache. */
export async function fetchTournament(): Promise<TournamentSnapshot> {
  const response = await fetch(TOURNAMENT_API_PATH, { cache: "no-store" });

  if (!response.ok) throw new Error(`El servidor respondió ${response.status}.`);

  const body: unknown = await response.json();

  if (!isSnapshot(body)) throw new Error("La respuesta del servidor no es un torneo válido.");

  return body;
}

function isSnapshot(value: unknown): value is TournamentSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    "serverNow" in value &&
    typeof value.serverNow === "number" &&
    "tournament" in value &&
    (value.tournament === null || isTournament(value.tournament))
  );
}

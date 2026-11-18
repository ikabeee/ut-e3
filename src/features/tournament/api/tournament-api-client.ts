import { isTournament } from "@features/tournament/lib/tournament-guards";
import type { EntryView, Tournament } from "@features/tournament/lib/types";

export const TOURNAMENT_API_PATH = "/api/tournament";

export const ENTRIES_API_PATH = "/api/tournament/entries";

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

/** Asks for the participants of the tournament (S26); only the sysadmin and the KOF administrator get an answer. */
export async function fetchEntries(): Promise<EntryView[]> {
  const response = await fetch(ENTRIES_API_PATH, { cache: "no-store" });

  if (!response.ok) throw new Error(`El servidor respondió ${response.status}.`);

  const body: unknown = await response.json();

  if (!isEntryList(body)) throw new Error("La respuesta del servidor no es una lista de participantes.");

  return body.entries;
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

// Like the bracket, the list only comes from our Route Handler: checking the fields the screen reads is enough.
function isEntryList(value: unknown): value is { entries: EntryView[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "entries" in value &&
    Array.isArray(value.entries) &&
    value.entries.every(isEntry)
  );
}

function isEntry(value: unknown): value is EntryView {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "gamertag" in value &&
    typeof value.gamertag === "string" &&
    "status" in value &&
    typeof value.status === "string" &&
    "channel" in value &&
    typeof value.channel === "string"
  );
}

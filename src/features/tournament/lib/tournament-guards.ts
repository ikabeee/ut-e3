import type { Tournament } from "@features/tournament/lib/types";

// Only the server writes the stored state and the Route Handler is the only one that sends it, so a light check is
// enough to catch a row that was edited by hand or a response that is not ours.
export function isTournament(value: unknown): value is Tournament {
  return (
    typeof value === "object" &&
    value !== null &&
    "phase" in value &&
    "players" in value &&
    Array.isArray(value.players) &&
    "matches" in value &&
    Array.isArray(value.matches) &&
    "version" in value &&
    typeof value.version === "number"
  );
}

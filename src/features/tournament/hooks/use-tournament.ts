"use client";

import { useCallback } from "react";
import { fetchTournament, type TournamentSnapshot } from "@features/tournament/api/tournament-api-client";
import type { Tournament } from "@features/tournament/lib/types";
import { usePolledValue } from "@shared/hooks/use-polled-value";

export const POLL_INTERVAL_MS = 3000;

export type SnapshotLoader = () => Promise<TournamentSnapshot>;

export interface TournamentPolling {
  tournament: Tournament | null;
  /** The last poll failed; the screen keeps showing the last state it received. */
  hasConnectionError: boolean;
  refresh: () => Promise<void>;
}

/** Keeps the bracket fresh every 3 seconds, starting from what the server rendered (RF-61). */
export function useTournament(initial: Tournament | null, load: SnapshotLoader = fetchTournament): TournamentPolling {
  const loadTournament = useCallback(async () => (await load()).tournament, [load]);

  const { value, hasConnectionError, refresh } = usePolledValue<Tournament | null>(initial, {
    load: loadTournament,
    merge: pickNewer,
    intervalMs: POLL_INTERVAL_MS,
  });

  return { tournament: value, hasConnectionError, refresh };
}

// Answers can arrive out of order; the version tells which copy is newer.
function pickNewer(current: Tournament | null, incoming: Tournament | null): Tournament | null {
  if (!incoming) return current;

  if (!current) return incoming;

  return incoming.version > current.version ? incoming : current;
}

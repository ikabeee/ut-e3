"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTournament, type TournamentSnapshot } from "@features/tournament/api/tournament-api-client";
import type { Tournament } from "@features/tournament/lib/types";

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
  const [tournament, setTournament] = useState(initial);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const isLoading = useRef(false);

  const refresh = useCallback(async () => {
    if (isLoading.current) return;

    isLoading.current = true;

    try {
      const snapshot = await load();

      setTournament((current) => pickNewer(current, snapshot.tournament));
      setHasConnectionError(false);
    } catch {
      setHasConnectionError(true);
    } finally {
      isLoading.current = false;
    }
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [refresh]);

  return { tournament, hasConnectionError, refresh };
}

// Answers can arrive out of order; the version tells which copy is newer.
function pickNewer(current: Tournament | null, incoming: Tournament | null): Tournament | null {
  if (!incoming) return current;

  if (!current) return incoming;

  return incoming.version > current.version ? incoming : current;
}

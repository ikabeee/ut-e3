"use client";

import { fetchPublicSnapshot } from "@features/tournament/api/public-bracket-api-client";
import { POLL_INTERVAL_MS } from "@features/tournament/hooks/use-tournament";
import type { PublicSnapshot } from "@features/tournament/lib/public-bracket";
import { usePolledValue } from "@shared/hooks/use-polled-value";

export type PublicSnapshotLoader = () => Promise<PublicSnapshot>;

export interface PublicBracketPolling {
  snapshot: PublicSnapshot;
  hasConnectionError: boolean;
}

/** Follows the public bracket every 3 seconds, so closing or reopening it reaches the open pages (RF-67, RF-74). */
export function usePublicBracket(
  initial: PublicSnapshot,
  load: PublicSnapshotLoader = fetchPublicSnapshot,
): PublicBracketPolling {
  const { value, hasConnectionError } = usePolledValue(initial, {
    load,
    merge: mergeSnapshots,
    intervalMs: POLL_INTERVAL_MS,
  });

  return { snapshot: value, hasConnectionError };
}

// A change of state always wins; two open answers are ordered by version, and the same state is not shown twice.
function mergeSnapshots(current: PublicSnapshot, incoming: PublicSnapshot): PublicSnapshot {
  if (current.state === "open" && incoming.state === "open") {
    return incoming.bracket.version > current.bracket.version ? incoming : current;
  }

  return current.state === incoming.state ? current : incoming;
}

"use client";

import { fetchEntries } from "@features/tournament/api/tournament-api-client";
import { POLL_INTERVAL_MS } from "@features/tournament/hooks/use-tournament";
import type { EntryView } from "@features/tournament/lib/types";
import { usePolledValue, type PolledValue } from "@shared/hooks/use-polled-value";

export type EntriesLoader = () => Promise<EntryView[]>;

/** Keeps the participants fresh at the pace of the bracket, starting from what the server rendered (S26). */
export function useEntries(initial: EntryView[], load: EntriesLoader = fetchEntries): PolledValue<EntryView[]> {
  return usePolledValue(initial, { load, merge: takeLatest, intervalMs: POLL_INTERVAL_MS });
}

// The list has no version number, so the latest answer replaces it.
function takeLatest(_current: EntryView[], incoming: EntryView[]): EntryView[] {
  return incoming;
}

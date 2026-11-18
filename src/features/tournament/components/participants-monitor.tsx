"use client";

import { ConnectionToast } from "@features/tournament/components/connection-toast";
import { EntriesPanel } from "@features/tournament/components/entries-panel";
import { useEntries, type EntriesLoader } from "@features/tournament/hooks/use-entries";
import type { EntryView } from "@features/tournament/lib/types";

interface ParticipantsMonitorProps {
  /** What the server rendered; the screen keeps it fresh by polling. */
  initial: EntryView[];
  hasBracket: boolean;
  /** Replaces the Route Handler request; the tests use it. */
  load?: EntriesLoader;
}

/**
 * The participants for the sysadmin, who only watches (S26): the list of the administrator, refreshed on its own. A
 * failed refresh keeps the list and says so in a toast (S7).
 */
export function ParticipantsMonitor({ initial, hasBracket, load }: Readonly<ParticipantsMonitorProps>) {
  const { value, hasConnectionError } = useEntries(initial, load);

  return (
    <>
      <ConnectionToast isLost={hasConnectionError} />
      <EntriesPanel entries={value} hasBracket={hasBracket} />
    </>
  );
}

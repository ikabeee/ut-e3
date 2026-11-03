import { useMemo, useSyncExternalStore } from "react";
import { parseSnapshot, type PassportSnapshot } from "@features/visitors/lib/passport-snapshot";
import { readRawPassportSnapshot } from "@features/visitors/lib/passport-snapshot-storage";

/** The copy of the passport saved in this phone, or `null`. The server and the first render have none. */
export function usePassportSnapshot(): PassportSnapshot | null {
  const raw = useSyncExternalStore(subscribe, readRawPassportSnapshot, readServerSnapshot);

  return useMemo(() => parseSnapshot(raw), [raw]);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);

  return () => window.removeEventListener("storage", onChange);
}

function readServerSnapshot(): string | null {
  return null;
}

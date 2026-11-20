import { useEffect, useState } from "react";
import { isPinFormat } from "@features/tournament/lib/entries-rules";

/** Asks the server for the entry of a PIN; it answers only the id of the entry, never the PIN. */
export type PinLookup = (pin: string) => Promise<string | null>;

interface PinMatch {
  pin: string;
  entryId: string | null;
}

/**
 * The id of the entry whose PIN is the search text, or `null`. It only asks when the text has the format of a PIN, and
 * an answer that arrives after the text changed is ignored.
 */
export function usePinMatch(text: string, lookup?: PinLookup): string | null {
  const pin = text.trim();
  const [match, setMatch] = useState<PinMatch | null>(null);

  useEffect(() => {
    if (!lookup || !isPinFormat(pin)) return;

    let isCurrent = true;

    lookup(pin)
      .catch(() => null)
      .then((entryId) => {
        if (isCurrent) setMatch({ pin, entryId });
      });

    return () => {
      isCurrent = false;
    };
  }, [pin, lookup]);

  return match?.pin === pin ? match.entryId : null;
}

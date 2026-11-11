import { useCallback, useSyncExternalStore } from "react";
import { replaceLocation, subscribeToLocation } from "@shared/lib/location-store";

function readHash() {
  return decodeURIComponent(window.location.hash.slice(1));
}

/**
 * Fragmento de la URL (`/floor-plan#A1` -> `"A1"`) como estado, para enlazar a una parte
 * de la página. En el prerender vale `""`; el navegador lo aplica al hidratar.
 */
export function useUrlHash() {
  const hash = useSyncExternalStore(subscribeToLocation, readHash, () => "");

  const setHash = useCallback((value: string) => {
    const url = new URL(window.location.href);
    url.hash = value;
    replaceLocation(`${url.pathname}${url.search}${url.hash}`);
  }, []);

  return [hash, setHash] as const;
}

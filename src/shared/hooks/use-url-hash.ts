import { useCallback, useSyncExternalStore } from "react";
import { replaceLocation, subscribeToLocation } from "@shared/lib/location-store";

/**
 * Lee el fragmento decodificado. Un hash mal codificado (`#%E0%A4%A`) hace que
 * `decodeURIComponent` lance `URIError`; se trata como vacío para no tumbar la página.
 */
function readHash() {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return "";
  }
}

/**
 * Fragmento de la URL (`/floor-plan#A1` -> `"A1"`) como estado, para enlazar a una parte
 * de la página. En el prerender vale `""`; el navegador lo aplica al hidratar. Si el hash
 * no se puede decodificar, también vale `""`.
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

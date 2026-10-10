import { useCallback, useSyncExternalStore } from "react";
import { replaceLocation, subscribeToLocation } from "@shared/lib/location-store";

/**
 * Estado guardado en un parámetro de la URL (`?genre=Puzle`), para que se pueda compartir.
 *
 * A diferencia de `useSearchParams`, no obliga a renderizar en el cliente la parte de la
 * página que lo usa: en el prerender el valor es `null` y el navegador lo aplica al hidratar.
 */
export function useSearchParamState(name: string) {
  const value = useSyncExternalStore(
    subscribeToLocation,
    () => new URLSearchParams(window.location.search).get(name),
    () => null,
  );

  const setValue = useCallback(
    (nextValue: string | null) => {
      const url = new URL(window.location.href);
      if (nextValue === null) {
        url.searchParams.delete(name);
      } else {
        url.searchParams.set(name, nextValue);
      }
      replaceLocation(`${url.pathname}${url.search}${url.hash}`);
    },
    [name],
  );

  return [value, setValue] as const;
}

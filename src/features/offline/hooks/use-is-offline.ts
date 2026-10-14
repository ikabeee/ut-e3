import { useSyncExternalStore } from "react";
import { useOffline } from "next/offline";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);

  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

const getSnapshot = () => !navigator.onLine;

// En el servidor se asume conexión; el cliente corrige al hidratar.
const getServerSnapshot = () => false;

/**
 * `true` si el sitio está sin conexión. Combina dos señales:
 * - `useOffline()` de Next: detecta navegaciones y Server Actions que fallan por la red, aunque el
 *   sistema diga que hay red (wifi sin internet). Se apaga cuando una comprobación con el servidor sale bien.
 * - `navigator.onLine`: cubre la página que ya abrió sin conexión desde el service worker, donde
 *   todavía no ha fallado ninguna petición del router y no llega el evento `offline`.
 */
export function useIsOffline(getNextOffline = useOffline) {
  const isNextOffline = getNextOffline();
  const isBrowserOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return isNextOffline || isBrowserOffline;
}

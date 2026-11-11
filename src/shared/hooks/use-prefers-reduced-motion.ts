import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;

// En el servidor no hay preferencia: se asume movimiento y el cliente corrige al hidratar.
const getServerSnapshot = () => false;

/** `true` si la persona pidió reducir las animaciones en su sistema operativo. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

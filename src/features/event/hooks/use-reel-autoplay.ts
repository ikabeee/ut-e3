import { useSyncExternalStore } from "react";
import { canAutoplayReel, REEL_AUTOPLAY_MEDIA_QUERY } from "@features/event/lib/event-media";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/** Parte de la Network Information API que se usa (TypeScript no la incluye en `Navigator`). */
interface NetworkConnection extends EventTarget {
  saveData?: boolean;
}

// SAFETY: la Network Information API no forma parte de los tipos estándar de Navigator en TypeScript.
const getConnection = () => (navigator as Navigator & { connection?: NetworkConnection }).connection;

function subscribeToWideScreen(onChange: () => void) {
  const mediaQuery = window.matchMedia(REEL_AUTOPLAY_MEDIA_QUERY);
  mediaQuery.addEventListener("change", onChange);

  return () => mediaQuery.removeEventListener("change", onChange);
}

const getWideScreenSnapshot = () => window.matchMedia(REEL_AUTOPLAY_MEDIA_QUERY).matches;

function subscribeToSaveData(onChange: () => void) {
  const connection = getConnection();
  connection?.addEventListener?.("change", onChange);

  return () => connection?.removeEventListener?.("change", onChange);
}

const getSaveDataSnapshot = () => getConnection()?.saveData === true;

// En el servidor no se conoce el dispositivo: se asume que NO hay reproducción automática,
// así el HTML es el mismo para todos y el video no se descarga antes de decidir en el cliente.
const getServerSnapshot = () => false;

/**
 * `true` si el reel puede descargarse y reproducirse solo: pantalla ancha, sin ahorro de datos
 * (`navigator.connection.saveData`) y sin `prefers-reduced-motion`. Al hidratar siempre vale
 * `false` (igual que el HTML del servidor) y se corrige justo después.
 */
export function useReelAutoplay() {
  const isWideScreen = useSyncExternalStore(subscribeToWideScreen, getWideScreenSnapshot, getServerSnapshot);
  const prefersSaveData = useSyncExternalStore(subscribeToSaveData, getSaveDataSnapshot, getServerSnapshot);
  const prefersReducedMotion = usePrefersReducedMotion();

  return canAutoplayReel({ isWideScreen, prefersSaveData, prefersReducedMotion });
}

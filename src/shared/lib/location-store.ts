/**
 * Suscripción mínima a la URL del navegador para leerla con `useSyncExternalStore`.
 *
 * `history.replaceState` no emite eventos, así que `replaceLocation` avisa a los
 * suscriptores con un evento propio. Next.js integra `replaceState` con su router.
 */
const LOCATION_CHANGE_EVENT = "utg:location-change";

export function subscribeToLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener("hashchange", onChange);
  window.addEventListener(LOCATION_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener(LOCATION_CHANGE_EVENT, onChange);
  };
}

/** Reemplaza la URL actual (sin agregar una entrada al historial) y avisa a los suscriptores. */
export function replaceLocation(url: string) {
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
}

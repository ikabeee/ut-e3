import { useSyncExternalStore } from "react";
import { getCountdownParts, type CountdownParts } from "@features/landing/lib/countdown";

function subscribe(onTick: () => void) {
  const interval = setInterval(onTick, 1000);

  return () => clearInterval(interval);
}

/** Segundo actual. Es un número, así que React sólo vuelve a renderizar cuando cambia el segundo. */
function getNowSnapshot() {
  return Math.floor(Date.now() / 1000) * 1000;
}

/** En el servidor y en la hidratación no hay hora: la cuenta regresiva no usa `Date.now()` al prerenderizar. */
function getServerSnapshot() {
  return null;
}

/** Tiempo que falta para `targetIso`, o `null` hasta que el navegador monta. Avanza cada segundo. */
export function useCountdown(targetIso: string): CountdownParts | null {
  const nowMs = useSyncExternalStore(subscribe, getNowSnapshot, getServerSnapshot);

  return nowMs === null ? null : getCountdownParts(targetIso, nowMs);
}

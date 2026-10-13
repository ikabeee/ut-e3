import type { StandTraffic } from "@features/visitors/lib/types";

/** Nivel de afluencia de un stand según los check-ins de la ventana (15 minutos). */
export type TrafficLevel = "low" | "medium" | "high";

/**
 * Umbrales de afluencia. Una demo dura unos 10 minutos, así que en 15 minutos un stand con
 * dos o tres equipos recibe entre 5 y 10 personas sin hacer fila.
 */
export const TRAFFIC_THRESHOLDS = { medium: 5, high: 10 } as const;

export function getTrafficLevel(recentCheckIns: number): TrafficLevel {
  if (recentCheckIns >= TRAFFIC_THRESHOLDS.high) return "high";

  return recentCheckIns >= TRAFFIC_THRESHOLDS.medium ? "medium" : "low";
}

/** Afluencia de un stand, o `null` si el stand no tiene juego. */
export function findStandTraffic(stands: readonly StandTraffic[], standCode: string) {
  return stands.find((stand) => stand.standCode === standCode) ?? null;
}

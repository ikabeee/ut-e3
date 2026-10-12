import { useQuery } from "@tanstack/react-query";
import { findStandTraffic } from "@features/visitors/lib/stand-traffic";
import { standTrafficQueryOptions } from "@features/visitors/lib/visitors-query-options";

/**
 * Afluencia de un stand en vivo. Todos los stands comparten una sola petición (misma query
 * key); devuelve `null` mientras carga o si el stand no tiene juego.
 */
export function useStandTraffic(standCode: string) {
  const { data } = useQuery(standTrafficQueryOptions());
  if (!data) return null;
  const traffic = findStandTraffic(data.stands, standCode);
  return traffic ? { recentCheckIns: traffic.recentCheckIns, windowMinutes: data.windowMinutes } : null;
}

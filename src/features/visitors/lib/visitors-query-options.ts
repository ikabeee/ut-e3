import { queryOptions } from "@tanstack/react-query";
import { fetchStandTraffic } from "@features/visitors/api/visitors-api-client";

/** Cada cuánto se refresca la afluencia; igual que la caché del servidor (30 s). */
export const STAND_TRAFFIC_REFRESH_MS = 30_000;

export const visitorsQueryKeys = {
  all: ["visitors"] as const,
  standTraffic: () => [...visitorsQueryKeys.all, "stand-traffic"] as const,
};

/**
 * Afluencia de los stands. No se prellena en el servidor (así el croquis se sigue
 * prerenderizando completo): el navegador la pide al montar y la refresca cada 30 segundos
 * mientras la pestaña está visible.
 *
 * `staleTime: "static"`: la caché de Next.js (30 s) es la fuente de verdad; `refetchInterval`
 * vuelve a pedirla aunque TanStack la considere fresca.
 */
export function standTrafficQueryOptions() {
  return queryOptions({
    queryKey: visitorsQueryKeys.standTraffic(),
    queryFn: fetchStandTraffic,
    staleTime: "static",
    refetchInterval: STAND_TRAFFIC_REFRESH_MS,
  });
}

import "server-only";
import { getStandTraffic } from "@features/visitors/lib/server/traffic-queries";

/**
 * `GET /api/stand-traffic`: afluencia de los stands para el croquis (`fetchStandTraffic`).
 * `src/app/api/stand-traffic/route.ts` sólo re-exporta este handler. `getStandTraffic()` se
 * cachea 30 segundos, así que Next.js lo resuelve al pedirlo y no en el build.
 */
export async function GET() {
  return Response.json(await getStandTraffic());
}

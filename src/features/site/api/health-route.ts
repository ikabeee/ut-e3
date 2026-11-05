import "server-only";
import { getHealthStatus } from "@features/site/lib/health-status";
import { getDatabaseFreeBytes } from "@shared/lib/server/disk-space";

const NO_STORE = { "Cache-Control": "no-store" };

// The HEALTHCHECK of the Docker image calls this. It stays light: it does not query the database, it only checks that
// the server answers and that the volume of the database has room, because a full disk leaves the kiosks with 500
// (SQLITE_FULL) while every page still loads.
export async function GET(): Promise<Response> {
  const status = getHealthStatus(await getDatabaseFreeBytes());

  return Response.json({ status }, { status: status === "ok" ? 200 : 503, headers: NO_STORE });
}

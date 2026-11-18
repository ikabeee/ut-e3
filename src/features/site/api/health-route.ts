import "server-only";
import { after } from "next/server";
import { getHealthStatus, type HealthStatus } from "@features/site/lib/health-status";
import { SITE_COPY } from "@features/site/lib/site-copy";
import { getDatabaseFreeBytes } from "@shared/lib/server/disk-space";
import { sendEmergencyAlert } from "@shared/lib/server/emergency-alert";

const NO_STORE = { "Cache-Control": "no-store" };

// The HEALTHCHECK of the Docker image calls this. It stays light: it does not query the database, it only checks that
// the server answers and that the volume of the database has room, because a full disk leaves the kiosks with 500
// (SQLITE_FULL) while every page still loads.
// A failing check is also a production emergency (S20); the email leaves after the answer, so the check stays fast.
export async function GET(): Promise<Response> {
  const freeBytes = await getDatabaseFreeBytes();
  const status = getHealthStatus(freeBytes);

  if (status !== "ok") after(() => alertUnhealthy(status, freeBytes));

  return Response.json({ status }, { status: status === "ok" ? 200 : 503, headers: NO_STORE });
}

async function alertUnhealthy(status: HealthStatus, freeBytes: number | null): Promise<void> {
  const freeMegabytes = Math.floor((freeBytes ?? 0) / (1024 * 1024));

  await sendEmergencyAlert({
    key: `health:${status}`,
    subject: SITE_COPY.emergency.lowDiskSubject,
    detail: SITE_COPY.emergency.lowDiskDetail(freeMegabytes),
  });
}

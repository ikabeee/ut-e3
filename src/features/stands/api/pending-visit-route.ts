import "server-only";
import { getVisitorPendingVisit } from "@features/stands/lib/server/pending-visit-queries";
import { getDeviceVisitorId } from "@shared/lib/server/visitor-device";

// For the passport: the device cookie says who is asking, and a device without a passport has nothing pending.
export async function GET(): Promise<Response> {
  const visitorId = await getDeviceVisitorId();
  const pending = visitorId ? await getVisitorPendingVisit(visitorId, new Date()) : null;

  return Response.json({ pending }, { headers: { "Cache-Control": "no-store" } });
}

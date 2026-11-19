import "server-only";
import { buildStandVisitsCsv } from "@features/moderation/lib/stand-visits-csv";
import { getStandVisits } from "@features/moderation/lib/server/moderation-queries";
import { csvDownload, refuseUnlessSysadmin } from "@shared/lib/server/csv-download";

// The sysadmin downloads the visits of a stand (RF-45).
export async function GET(request: Request): Promise<Response> {
  const refusal = await refuseUnlessSysadmin();

  if (refusal) return refusal;

  const standId = new URL(request.url).searchParams.get("stand")?.trim() ?? "";

  if (!standId)
    return Response.json({ error: "missing_stand" }, { status: 400, headers: { "Cache-Control": "no-store" } });

  return csvDownload(buildStandVisitsCsv(await getStandVisits(standId)), "stand-visits.csv");
}

import "server-only";
import { getSessionAccount } from "@shared/lib/server/session";
import { buildStandVisitsCsv } from "@features/moderation/lib/stand-visits-csv";
import { getStandVisits } from "@features/moderation/lib/server/moderation-queries";

const NO_STORE = { "Cache-Control": "no-store" };

// The sysadmin downloads the visits of a stand (RF-45). Others get 401, not a redirect, because this is a file.
export async function GET(request: Request): Promise<Response> {
  const account = await getSessionAccount();

  if (account?.role !== "sysadmin") {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const standId = new URL(request.url).searchParams.get("stand")?.trim() ?? "";

  if (!standId) return Response.json({ error: "missing_stand" }, { status: 400, headers: NO_STORE });

  const csv = buildStandVisitsCsv(await getStandVisits(standId));

  return new Response(`﻿${csv}`, {
    headers: {
      ...NO_STORE,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="stand-visits.csv"',
    },
  });
}

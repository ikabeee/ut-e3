import "server-only";
import { buildVisitorsCsv } from "@features/visitors/lib/visitors-csv";
import { listAdminVisitorsForExport } from "@features/visitors/lib/server/visitors-admin-queries";
import { parseVisitorListParams } from "@features/visitors/lib/visitors-admin";
import { csvDownload, refuseUnlessSysadmin } from "@shared/lib/server/csv-download";

// The sysadmin downloads the registrations that match `?q=` and `?sort=`.
export async function GET(request: Request): Promise<Response> {
  const refusal = await refuseUnlessSysadmin();

  if (refusal) return refusal;

  const search = new URL(request.url).searchParams;
  const params = parseVisitorListParams({ q: search.get("q") ?? undefined, sort: search.get("sort") ?? undefined });

  return csvDownload(buildVisitorsCsv(await listAdminVisitorsForExport(params)), "visitors.csv");
}

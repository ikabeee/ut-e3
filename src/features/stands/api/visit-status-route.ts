import "server-only";
import { getStandAccount } from "@features/accounts/lib/server/current-account";
import { getPendingVisitStatus } from "@features/stands/lib/server/pending-visit-queries";

const NO_STORE = { "Cache-Control": "no-store" };

// For the kiosk: only the stand account that started the visit can ask how it is going.
export async function GET(request: Request): Promise<Response> {
  const account = await getStandAccount();

  if (!account) return Response.json({ error: "Sin sesión de stand." }, { status: 401, headers: NO_STORE });

  const pendingVisitId = new URL(request.url).searchParams.get("id") ?? "";
  const status = await getPendingVisitStatus(pendingVisitId, account.standId, new Date());

  return Response.json({ status }, { headers: NO_STORE });
}

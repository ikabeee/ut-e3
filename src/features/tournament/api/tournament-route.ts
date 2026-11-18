import "server-only";
import { getKofViewer } from "@features/accounts/lib/server/current-account";
import { getTournament } from "@features/tournament/lib/server/tournament-queries";

const NO_STORE = { "Cache-Control": "no-store" };

// The KOF accounts and the sysadmin, who watches /admin/kof, read the whole bracket; everyone else gets 401, not a redirect.
export async function GET(): Promise<Response> {
  if (!(await getKofViewer())) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const tournament = await getTournament();

  return Response.json({ tournament, serverNow: Date.now() }, { headers: NO_STORE });
}

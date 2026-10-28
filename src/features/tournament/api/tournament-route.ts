import "server-only";
import { getKofAccount } from "@features/accounts/lib/server/current-account";
import { getTournament } from "@features/tournament/lib/server/tournament-queries";

const NO_STORE = { "Cache-Control": "no-store" };

// Only the KOF accounts read the bracket until the public view exists (RF-67); everyone else gets 401, not a redirect.
export async function GET(): Promise<Response> {
  if (!(await getKofAccount())) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const tournament = await getTournament();

  return Response.json({ tournament, serverNow: Date.now() }, { headers: NO_STORE });
}

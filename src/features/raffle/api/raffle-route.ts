import "server-only";
import { getRaffleAdmin } from "@features/accounts/lib/server/current-account";
import { getRaffleAdminSnapshot } from "@features/raffle/lib/server/raffle-queries";

const NO_STORE = { "Cache-Control": "no-store" };

// Only the raffle administrators read the panel; everyone else gets 401, not a redirect.
export async function GET(): Promise<Response> {
  if (!(await getRaffleAdmin())) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  return Response.json(await getRaffleAdminSnapshot(new Date()), { headers: NO_STORE });
}

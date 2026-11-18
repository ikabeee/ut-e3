import "server-only";
import { getKofViewer } from "@features/accounts/lib/server/current-account";
import { canViewEntries } from "@features/tournament/lib/tournament-rules";
import { getEntries } from "@features/tournament/lib/server/entries-queries";

const NO_STORE = { "Cache-Control": "no-store" };

// S26: the sysadmin and the KOF administrator read the participants; the desks get 403 and everyone else 401.
export async function GET(): Promise<Response> {
  const viewer = await getKofViewer();

  if (!viewer) return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });

  if (!canViewEntries(viewer.role)) return Response.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });

  return Response.json({ entries: await getEntries() }, { headers: NO_STORE });
}

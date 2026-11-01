import "server-only";
import { getPublicSnapshot } from "@features/tournament/lib/server/public-bracket-queries";

// Public on purpose: no session. What leaves is the public view of the bracket, and nothing at all while it is closed.
export async function GET(): Promise<Response> {
  return Response.json(await getPublicSnapshot(new Date()), { headers: { "Cache-Control": "no-store" } });
}

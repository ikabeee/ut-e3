import "server-only";
import { recordPublicBracketRequest } from "@features/tournament/lib/server/public-bracket-audience";
import { getPublicSnapshot } from "@features/tournament/lib/server/public-bracket-queries";

// Public on purpose: no session. What leaves is the public view of the bracket, and nothing at all while it is closed.
// Each request counts in the audience that the server status of the sysadmin shows (RF-73).
export async function GET(request: Request): Promise<Response> {
  recordPublicBracketRequest(request);

  return Response.json(await getPublicSnapshot(new Date()), { headers: { "Cache-Control": "no-store" } });
}

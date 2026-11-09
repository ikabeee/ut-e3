import "server-only";
import { getRaffleLiveSnapshot } from "@features/raffle/lib/server/raffle-queries";

// Public on purpose: no session. What leaves is the drum and the confirmed winners, with gamertags only (RF-49, RF-56).
export async function GET(): Promise<Response> {
  return Response.json(await getRaffleLiveSnapshot(new Date()), { headers: { "Cache-Control": "no-store" } });
}

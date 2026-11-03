import "server-only";
import { connection } from "next/server";
import { getGames } from "@features/games/lib/server/games-queries";
import { buildPrecachePaths } from "@features/pwa/lib/precache-paths";

const NO_STORE = { "Cache-Control": "no-store" };

// Public data only: the list of public pages to save on the phone. It changes when a stand registers its game.
export async function GET(): Promise<Response> {
  await connection();

  const games = await getGames();

  return Response.json({ paths: buildPrecachePaths(games.map((game) => game.slug)) }, { headers: NO_STORE });
}

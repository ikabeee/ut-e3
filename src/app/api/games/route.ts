import { listGames } from "@features/games/lib/server/games-queries";

/** Lista de juegos para TanStack Query en el navegador (`fetchGames`). */
export async function GET() {
  return Response.json(await listGames());
}

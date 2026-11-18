import "server-only";
import type { GameSuggestionsBody } from "@features/games/api/games-contract";
import { getGames } from "@features/games/lib/server/games-queries";

/**
 * The public games for the suggestions of the navbar search (S21): slug, name and genre only. It reads the same cached
 * list as the catalog, so a game that is not public yet is not suggested either.
 */
export async function GET(): Promise<Response> {
  const games = await getGames();

  const body: GameSuggestionsBody = {
    games: games.map((game) => ({ slug: game.slug, name: game.name, genreName: game.genre.name })),
  };

  return Response.json(body);
}

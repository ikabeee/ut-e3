import { parseGamesResponse } from "@features/games/api/games-contract";
import type { Game } from "@features/games/lib/types";

/** Ruta pública de los juegos (`src/app/api/games/route.ts` -> `api/games-route.ts`). */
export const GAMES_API_PATH = "/api/games";

/** Lee los juegos desde el Route Handler y valida la respuesta. Se ejecuta en el navegador. */
export async function fetchGames(): Promise<Game[]> {
  const response = await fetch(GAMES_API_PATH);

  if (!response.ok) {
    throw new Error(`No se pudieron cargar los juegos (${response.status}).`);
  }

  return parseGamesResponse(await response.json());
}

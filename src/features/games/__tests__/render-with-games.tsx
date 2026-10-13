import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";
import { gamesQueryKeys } from "@features/games/lib/games-query-options";
import type { Game } from "@features/games/lib/types";

/**
 * Renderiza `ui` con un `QueryClient` nuevo que ya tiene los juegos de prueba (`GAME_FIXTURES`) en
 * caché, como si la page los hubiera prellenado en el servidor. Lo usan las pruebas de componentes
 * que leen los juegos. `games` reemplaza el catálogo (por ejemplo, `[]` para un catálogo vacío).
 */
export function renderWithGames(ui: ReactElement, games: readonly Game[] = GAME_FIXTURES) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(gamesQueryKeys.list(), [...games]);

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

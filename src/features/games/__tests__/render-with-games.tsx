import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { GAME_FIXTURES } from "@features/games/__tests__/game-fixtures";
import { gamesQueryKeys } from "@features/games/lib/games-query-options";

/**
 * Renderiza `ui` con un `QueryClient` nuevo que ya tiene los juegos de prueba (`GAME_FIXTURES`) en
 * caché, como si la page los hubiera prellenado en el servidor. Lo usan las pruebas de componentes
 * que leen los juegos.
 */
export function renderWithGames(ui: ReactElement) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(gamesQueryKeys.list(), [...GAME_FIXTURES]);

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

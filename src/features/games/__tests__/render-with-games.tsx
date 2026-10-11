import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { gamesQueryKeys } from "@features/games/lib/games-query-options";
import { MOCK_GAMES } from "@features/games/lib/mock-games";

/**
 * Renderiza `ui` con un `QueryClient` nuevo que ya tiene el catálogo mock en caché, como si la
 * page lo hubiera prellenado en el servidor. Lo usan las pruebas de componentes que leen los juegos.
 */
export function renderWithGames(ui: ReactElement) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(gamesQueryKeys.list(), [...MOCK_GAMES]);

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

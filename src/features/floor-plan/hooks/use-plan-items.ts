import { useMemo } from "react";
import { buildPlanItems, indexItems } from "@features/floor-plan/lib/plan-items";
import { useGames } from "@features/games/hooks/use-games";

/** Elementos del croquis a partir de los juegos (cada juego ocupa su stand). */
export function usePlanItems() {
  const games = useGames();

  return useMemo(() => {
    const items = buildPlanItems(games);
    return { items, itemsById: indexItems(items) };
  }, [games]);
}

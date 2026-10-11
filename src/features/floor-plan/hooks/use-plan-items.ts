import { useMemo } from "react";
import { buildPlanItems, indexItems } from "@features/floor-plan/lib/plan-items";
import type { StandOccupant } from "@features/floor-plan/lib/types";

/** Elementos del croquis a partir de los ocupantes de los stands de equipo. */
export function usePlanItems(occupants: readonly StandOccupant[]) {
  return useMemo(() => {
    const items = buildPlanItems(occupants);
    return { items, itemsById: indexItems(items) };
  }, [occupants]);
}

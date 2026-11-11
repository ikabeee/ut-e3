import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { usePlanFlash } from "@features/floor-plan/hooks/use-plan-flash";
import { usePlanItems } from "@features/floor-plan/hooks/use-plan-items";
import { usePlanViewport } from "@features/floor-plan/hooks/use-plan-viewport";
import { findItemRect, getBaseViewBox, PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import { toggleCategory } from "@features/floor-plan/lib/plan-items";
import { PLAN_CATEGORIES } from "@features/floor-plan/lib/plan-places";
import { focusViewBox } from "@features/floor-plan/lib/plan-viewport";
import type { PlanCategory, PlanOrientation } from "@features/floor-plan/lib/types";
import { useElementWidth } from "@shared/hooks/use-element-width";
import { useUrlHash } from "@shared/hooks/use-url-hash";

/** Debajo de este ancho el croquis usa la orientación vertical. */
export const EXPLORER_TALL_BREAKPOINT = 560;
/** Elemento seleccionado cuando la URL no indica otro. */
const DEFAULT_ITEM_ID = "stage";

const BASE_VIEW_BOXES = {
  wide: getBaseViewBox(PLAN_LAYOUTS.wide),
  tall: getBaseViewBox(PLAN_LAYOUTS.tall),
} as const;

interface SelectOptions {
  /** Acerca la vista al elemento. */
  focus?: boolean;
  /** Hace parpadear el elemento. */
  flash?: boolean;
}

/**
 * Estado del croquis interactivo: selección (guardada en la URL, `/floor-plan#A1`), filtros,
 * orientación y zoom de cada orientación.
 */
export function useFloorPlanExplorer(viewportRef: RefObject<HTMLElement | null>) {
  const { items, itemsById } = usePlanItems();
  const [hash, setHash] = useUrlHash();
  const [visibleCategories, setVisibleCategories] = useState<ReadonlySet<PlanCategory>>(
    () => new Set(PLAN_CATEGORIES),
  );

  const width = useElementWidth(viewportRef);
  const orientation: PlanOrientation = width !== null && width < EXPLORER_TALL_BREAKPOINT ? "tall" : "wide";
  const viewports = {
    wide: usePlanViewport(BASE_VIEW_BOXES.wide),
    tall: usePlanViewport(BASE_VIEW_BOXES.tall),
  };
  const flash = usePlanFlash(viewportRef);
  const { animateTo: animateWide } = viewports.wide;
  const { animateTo: animateTall } = viewports.tall;

  const selectedId = itemsById.has(hash) ? hash : DEFAULT_ITEM_ID;
  const selectedItem = itemsById.get(selectedId) ?? null;

  /** Acerca las dos orientaciones al elemento (sólo una está visible). */
  const focusItem = useCallback(
    (id: string) => {
      const wideRect = findItemRect(PLAN_LAYOUTS.wide, id);
      const tallRect = findItemRect(PLAN_LAYOUTS.tall, id);
      if (wideRect) {
        animateWide(focusViewBox(wideRect, BASE_VIEW_BOXES.wide));
      }
      if (tallRect) {
        animateTall(focusViewBox(tallRect, BASE_VIEW_BOXES.tall));
      }
    },
    [animateTall, animateWide],
  );

  // Última selección hecha desde la página: así se distingue de un cambio externo del hash.
  const lastSelectedId = useRef<string | null>(null);

  const select = useCallback(
    (id: string, { focus = true, flash: shouldFlash = false }: SelectOptions = {}) => {
      if (!itemsById.has(id)) {
        return;
      }
      lastSelectedId.current = id;
      setHash(id);
      if (focus) {
        focusItem(id);
      }
      if (shouldFlash) {
        flash(id);
      }
    },
    [flash, focusItem, itemsById, setHash],
  );

  // Al llegar con `#A1` (o si cambia el hash desde fuera) se enfoca y señala el elemento.
  useEffect(() => {
    if (hash !== lastSelectedId.current && itemsById.has(hash)) {
      lastSelectedId.current = hash;
      focusItem(hash);
      flash(hash);
    }
  }, [flash, focusItem, hash, itemsById]);

  return {
    items,
    itemsById,
    selectedId,
    selectedItem,
    select,
    visibleCategories,
    toggleCategory: (category: PlanCategory) => setVisibleCategories((current) => toggleCategory(current, category)),
    orientation,
    viewports,
    activeViewport: viewports[orientation],
  };
}

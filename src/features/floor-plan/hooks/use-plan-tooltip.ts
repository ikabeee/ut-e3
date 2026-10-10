import { useCallback, useState, type PointerEvent, type RefObject } from "react";
import type { TooltipAnchor } from "@features/floor-plan/lib/types";

interface TooltipState {
  itemId: string;
  anchor: TooltipAnchor;
}

/**
 * Tooltip del croquis: muestra el stand o zona bajo el puntero (no en pantallas táctiles).
 * Se oculta al salir del croquis o al empezar a arrastrar.
 */
export function usePlanTooltip(containerRef: RefObject<HTMLElement | null>) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const hide = useCallback(() => setTooltip(null), []);

  const update = useCallback(
    (event: PointerEvent<Element>) => {
      const container = containerRef.current;
      const target = event.target instanceof Element ? event.target.closest("[data-plan-item]") : null;
      const itemId = target?.getAttribute("data-plan-item");
      if (!container || !itemId || event.pointerType === "touch") {
        setTooltip(null);
        return;
      }
      const rect = container.getBoundingClientRect();
      setTooltip({
        itemId,
        anchor: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          containerWidth: rect.width,
          containerHeight: rect.height,
        },
      });
    },
    [containerRef],
  );

  return { tooltip, update, hide };
}

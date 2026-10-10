"use client";

import { useRef, type PointerEvent } from "react";
import { cn } from "@heroui/react";
import { FloorPlanDrawing, type FloorPlanSelectionProps } from "@features/floor-plan/components/floor-plan-drawing";
import { usePlanGestures } from "@features/floor-plan/hooks/use-plan-gestures";
import type { PlanViewport } from "@features/floor-plan/hooks/use-plan-viewport";
import { PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import { toViewBoxAttribute } from "@features/floor-plan/lib/plan-viewport";
import type { PlanOrientation } from "@features/floor-plan/lib/types";

interface ExplorerCanvasProps extends FloorPlanSelectionProps {
  orientation: PlanOrientation;
  viewport: PlanViewport;
  /** Muestra u oculta esta orientación con container queries. */
  className?: string;
  onPointerHover: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerLeave: () => void;
}

/** Un croquis interactivo (una orientación) con arrastre, zoom y teclado. */
export function ExplorerCanvas({
  orientation,
  viewport,
  className,
  onPointerHover,
  onPointerLeave,
  onSelectItem,
  ...selectionProps
}: Readonly<ExplorerCanvasProps>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { isGrabbing, consumeDrag, handlers } = usePlanGestures(svgRef, viewport);

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const isPressed = handlers.onPointerMove(event);
    if (isPressed) {
      onPointerLeave();
    } else {
      onPointerHover(event);
    }
  };

  return (
    <svg
      ref={svgRef}
      viewBox={toViewBoxAttribute(viewport.viewBox)}
      preserveAspectRatio="xMidYMid meet"
      role="application"
      aria-label="Croquis interactivo. Arrastra para mover, usa la rueda o pellizca para acercar."
      tabIndex={0}
      className={cn(
        "h-auto w-full cursor-grab focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
        isGrabbing && "cursor-grabbing",
        className,
      )}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
      onPointerLeave={onPointerLeave}
      onKeyDown={handlers.onKeyDown}
    >
      <FloorPlanDrawing
        layout={PLAN_LAYOUTS[orientation]}
        orientation={orientation}
        variant="explorer"
        onSelectItem={(id) => {
          if (!consumeDrag()) {
            onSelectItem(id);
          }
        }}
        {...selectionProps}
      />
    </svg>
  );
}

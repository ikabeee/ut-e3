"use client";

import { PlanItemShape } from "@features/floor-plan/components/plan-item-shape";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { getItemInteraction, type PlanSelection } from "@features/floor-plan/lib/plan-interaction";
import type { FloorPlanVariant, PlanLayout, PlanRect } from "@features/floor-plan/lib/types";

interface PlanEntryProps {
  layout: Pick<PlanLayout, "entry" | "entryLabelAt" | "height">;
  variant: FloorPlanVariant;
  selection: PlanSelection;
  /** Área táctil de la entrada (`getTouchRects`). */
  touchRect?: PlanRect;
}

/**
 * Entrada del recinto: rectángulo punteado con una flecha hacia adentro. En el croquis del
 * inicio lleva además el texto "ENTRADA" (en `entryLabelAt` o debajo de la entrada).
 */
export function PlanEntry({ layout, variant, selection, touchRect }: Readonly<PlanEntryProps>) {
  const [x, y, width, height] = layout.entry;
  const center = x + width / 2;
  const arrowPath = `M${center} ${y + height - 8} V${y + 14} M${center - 12} ${y + 26} L${center} ${y + 14} L${center + 12} ${y + 26}`;

  return (
    <>
      <PlanItemShape
        id="entry"
        label={selection.itemsById.get("entry")?.title ?? FLOOR_PLAN_COPY.drawing.entry}
        rect={layout.entry}
        fill="var(--accent)"
        fillOpacity={0.06}
        stroke="var(--accent)"
        strokeDasharray="5 4"
        touchRect={touchRect}
        {...getItemInteraction("entry", selection)}
      >
        <path d={arrowPath} stroke="var(--accent)" strokeWidth={3} fill="none" />
      </PlanItemShape>
      {variant === "overview" ? (
        <text
          x={layout.entryLabelAt?.[0] ?? center}
          y={layout.entryLabelAt?.[1] ?? layout.height - 4}
          textAnchor="middle"
          fontSize={layout.entryLabelAt ? 11 : 10}
          fill="var(--accent)"
          className="pointer-events-none font-mono"
        >
          {FLOOR_PLAN_COPY.drawing.entry.toLocaleUpperCase("es")}
        </text>
      ) : null}
    </>
  );
}

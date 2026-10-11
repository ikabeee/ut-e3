"use client";

import { useMemo } from "react";
import { FloorPlanDrawing } from "@features/floor-plan/components/floor-plan-drawing";
import { PlanItemCard } from "@features/floor-plan/components/plan-item-card";
import { PlanLegend } from "@features/floor-plan/components/plan-legend";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { indexItems } from "@features/floor-plan/lib/plan-items";
import type { PlanItem, PlanLayout, PlanOrientation } from "@features/floor-plan/lib/types";

interface FloorPlanOverviewProps {
  /** Stands y zonas del croquis (`buildPlanItems`). */
  items: readonly PlanItem[];
  /** Geometría de cada orientación (`PLAN_LAYOUTS`). */
  layouts: Readonly<Record<PlanOrientation, PlanLayout>>;
  selectedId: string;
  onSelect: (id: string) => void;
}

const ORIENTATIONS: { orientation: PlanOrientation; className: string }[] = [
  { orientation: "wide", className: "hidden @min-[600px]:block" },
  { orientation: "tall", className: "block @min-[600px]:hidden" },
];

/**
 * Croquis resumido de la portada (`.map-wrap`): el plano sin zoom, el panel del elemento
 * seleccionado y la leyenda. La selección la controla quien lo usa (el programa la cambia).
 */
export function FloorPlanOverview({ items, layouts, selectedId, onSelect }: Readonly<FloorPlanOverviewProps>) {
  const itemsById = useMemo(() => indexItems(items), [items]);
  const selectedItem = itemsById.get(selectedId);

  return (
    <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-[1fr_340px] items-start gap-gutter max-[1000px]:grid-cols-1">
      <div className="@container min-w-0 overflow-hidden border border-border bg-background">
        {ORIENTATIONS.map(({ orientation, className }) => {
          const layout = layouts[orientation];
          return (
            <svg
              key={orientation}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              preserveAspectRatio="xMidYMid meet"
              role="group"
              aria-label={FLOOR_PLAN_COPY.overview.mapLabel}
              className={`h-auto w-full max-w-full ${className}`}
            >
              <FloorPlanDrawing
                layout={layout}
                orientation={orientation}
                variant="overview"
                itemsById={itemsById}
                selectedId={selectedId}
                onSelectItem={onSelect}
              />
            </svg>
          );
        })}
      </div>
      <aside className="flex min-w-0 flex-col">
        {selectedItem ? <PlanItemCard item={selectedItem} variant="overview" /> : null}
        <PlanLegend />
      </aside>
    </div>
  );
}

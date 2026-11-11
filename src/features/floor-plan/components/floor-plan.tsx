"use client";

import { useMemo, useRef } from "react";
import { PlanDrawing } from "@features/floor-plan/components/plan-drawing";
import { PlanLegend } from "@features/floor-plan/components/plan-legend";
import { PlanPanel } from "@features/floor-plan/components/plan-panel";
import { usePlanOrientation } from "@features/floor-plan/hooks/use-plan-orientation";
import { usePlanSelection } from "@features/floor-plan/hooks/use-plan-selection";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { FLOOR_PLAN_SECTION_ID } from "@features/floor-plan/lib/floor-plan-links";
import { buildPlanItems } from "@features/floor-plan/lib/plan-items";
import { PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import type { FloorPlanStand } from "@features/floor-plan/lib/types";

interface FloorPlanProps {
  stands: readonly FloorPlanStand[];
}

export function FloorPlan({ stands }: Readonly<FloorPlanProps>) {
  const sectionRef = useRef<HTMLElement>(null);
  const [mapRef, orientation] = usePlanOrientation();
  const items = useMemo(() => buildPlanItems(stands), [stands]);
  const { selectedId, selectItem } = usePlanSelection(items, sectionRef);
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const selectedItem = itemsById.get(selectedId);
  const layout = PLAN_LAYOUTS[orientation];

  return (
    <section ref={sectionRef} id={FLOOR_PLAN_SECTION_ID} className="section-block">
      <div className="page-wrap">
        <h2 className="type-giant">{FLOOR_PLAN_COPY.heading}</h2>
        <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-[1fr_340px] items-start gap-gutter max-[1000px]:grid-cols-1">
          <div ref={mapRef} className="min-w-0 overflow-hidden border border-border bg-background">
            <svg
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              preserveAspectRatio="xMidYMid meet"
              role="group"
              aria-label={FLOOR_PLAN_COPY.mapLabel}
              className="h-auto w-full max-w-full"
            >
              <PlanDrawing layout={layout} selection={{ itemsById, selectedId, onSelectItem: selectItem }} />
            </svg>
          </div>
          <aside className="flex min-w-0 flex-col">
            {selectedItem ? <PlanPanel item={selectedItem} /> : null}
            <PlanLegend />
          </aside>
        </div>
      </div>
    </section>
  );
}

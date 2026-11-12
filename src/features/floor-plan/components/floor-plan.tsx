"use client";

import { useMemo, useRef } from "react";
import { PlanDrawing } from "@features/floor-plan/components/plan-drawing";
import { PlanLegend } from "@features/floor-plan/components/plan-legend";
import { PlanPanel } from "@features/floor-plan/components/plan-panel";
import { usePlanSelection } from "@features/floor-plan/hooks/use-plan-selection";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { FLOOR_PLAN_SECTION_ID } from "@features/floor-plan/lib/floor-plan-links";
import { buildPlanItems } from "@features/floor-plan/lib/plan-items";
import { PLAN_LAYOUT } from "@features/floor-plan/lib/plan-layouts";
import type { FloorPlanStand } from "@features/floor-plan/lib/types";

interface FloorPlanProps {
  stands: readonly FloorPlanStand[];
}

export function FloorPlan({ stands }: Readonly<FloorPlanProps>) {
  const sectionRef = useRef<HTMLElement>(null);
  const items = useMemo(() => buildPlanItems(stands), [stands]);
  const { selectedId, selectItem } = usePlanSelection(items, sectionRef);
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const selectedItem = itemsById.get(selectedId);

  return (
    <section ref={sectionRef} id={FLOOR_PLAN_SECTION_ID} className="section-block">
      <div className="page-wrap">
        <h2 className="type-giant">{FLOOR_PLAN_COPY.heading}</h2>
        <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 items-start gap-gutter min-[1000px]:grid-cols-[minmax(0,520px)_minmax(0,440px)]">
          <div className="min-w-0 overflow-hidden border border-border bg-background">
            <svg
              viewBox={`0 0 ${PLAN_LAYOUT.width} ${PLAN_LAYOUT.height}`}
              preserveAspectRatio="xMidYMid meet"
              role="group"
              aria-label={FLOOR_PLAN_COPY.mapLabel}
              className="h-auto w-full max-w-full"
            >
              <PlanDrawing layout={PLAN_LAYOUT} selection={{ itemsById, selectedId, onSelectItem: selectItem }} />
            </svg>
          </div>
          <aside className="flex min-w-0 flex-col min-[1000px]:sticky min-[1000px]:top-[calc(var(--nav-height)+24px)]">
            {selectedItem ? <PlanPanel item={selectedItem} /> : null}
            <PlanLegend />
          </aside>
        </div>
      </div>
    </section>
  );
}

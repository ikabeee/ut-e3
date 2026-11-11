"use client";

import { useRef } from "react";
import { ExplorerCanvas } from "@features/floor-plan/components/explorer-canvas";
import { PlanCategoryFilters } from "@features/floor-plan/components/plan-category-filters";
import { PlanDirectory } from "@features/floor-plan/components/plan-directory";
import { PlanItemCard } from "@features/floor-plan/components/plan-item-card";
import { PlanTooltip } from "@features/floor-plan/components/plan-tooltip";
import { PlanZoomControls } from "@features/floor-plan/components/plan-zoom-controls";
import { useFloorPlanExplorer } from "@features/floor-plan/hooks/use-floor-plan-explorer";
import { usePlanTooltip } from "@features/floor-plan/hooks/use-plan-tooltip";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/** En pantallas angostas el directorio queda debajo del croquis. */
const STACKED_LAYOUT_MAX_WIDTH = 900;

/** Croquis interactivo completo (`croquis.html`): filtros, mapa con zoom, panel y directorio. */
export function FloorPlanExplorer() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const explorer = useFloorPlanExplorer(viewportRef);
  const tooltip = usePlanTooltip(viewportRef);
  const prefersReducedMotion = usePrefersReducedMotion();
  const tooltipItem = tooltip.tooltip ? explorer.itemsById.get(tooltip.tooltip.itemId) : undefined;

  const selectionProps = {
    itemsById: explorer.itemsById,
    selectedId: explorer.selectedId,
    visibleCategories: explorer.visibleCategories,
    onSelectItem: (id: string) => explorer.select(id),
    onPointerHover: tooltip.update,
    onPointerLeave: tooltip.hide,
  };

  const selectFromDirectory = (id: string) => {
    explorer.select(id, { flash: true });
    if (window.innerWidth < STACKED_LAYOUT_MAX_WIDTH) {
      viewportRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
    }
  };

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="type-giant">Croquis</h1>
          <p className="mt-[14px] mb-0 max-w-[52ch] text-[clamp(15px,1.2vw,18px)] leading-[1.4] text-copy">
            Ubica los stands de cada equipo, el main stage, la arena de torneos y los servicios del evento. Toca
            cualquier punto del mapa para ver su información.
          </p>
        </div>
        <PlanCategoryFilters visibleCategories={explorer.visibleCategories} onToggle={explorer.toggleCategory} />
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-gutter [grid-template-areas:'viewport_side'_'bar_side'] max-[900px]:grid-cols-1 max-[900px]:[grid-template-areas:'viewport'_'bar'_'side']">
        <div
          ref={viewportRef}
          className="@container relative min-w-0 touch-none overflow-hidden border border-border bg-background select-none [grid-area:viewport]"
        >
          <ExplorerCanvas
            orientation="wide"
            viewport={explorer.viewports.wide}
            className="hidden @min-[560px]:block"
            {...selectionProps}
          />
          <ExplorerCanvas
            orientation="tall"
            viewport={explorer.viewports.tall}
            className="block @min-[560px]:hidden"
            {...selectionProps}
          />
          {tooltip.tooltip && tooltipItem ? <PlanTooltip item={tooltipItem} anchor={tooltip.tooltip.anchor} /> : null}
        </div>

        <div className="mt-[calc(var(--gutter)*-1+10px)] flex flex-wrap items-center justify-end gap-3 [grid-area:bar]">
          <PlanZoomControls
            zoomPercent={explorer.activeViewport.zoomPercent}
            onZoomOut={() => explorer.activeViewport.zoomStep(-1)}
            onZoomIn={() => explorer.activeViewport.zoomStep(1)}
            onFit={explorer.activeViewport.reset}
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-4 [grid-area:side]">
          {explorer.selectedItem ? <PlanItemCard item={explorer.selectedItem} variant="explorer" /> : null}
          <PlanDirectory
            items={explorer.items}
            selectedId={explorer.selectedId}
            visibleCategories={explorer.visibleCategories}
            onSelect={selectFromDirectory}
          />
        </aside>
      </div>
    </>
  );
}

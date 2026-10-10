"use client";

import { ToggleButton } from "@heroui/react";
import { CategorySwatch } from "@features/floor-plan/components/category-swatch";
import { PLAN_CATEGORIES, PLAN_FILTER_LABELS } from "@features/floor-plan/lib/plan-places";
import type { PlanCategory } from "@features/floor-plan/lib/types";

interface PlanCategoryFiltersProps {
  visibleCategories: ReadonlySet<PlanCategory>;
  onToggle: (category: PlanCategory) => void;
}

/** Filtros por categoría, que también funcionan como leyenda (`.filters`). */
export function PlanCategoryFilters({ visibleCategories, onToggle }: Readonly<PlanCategoryFiltersProps>) {
  return (
    <div role="group" aria-label="Mostrar en el mapa" className="flex flex-wrap gap-[6px]">
      {PLAN_CATEGORIES.map((category) => (
        <ToggleButton
          key={category}
          isSelected={visibleCategories.has(category)}
          onChange={() => onToggle(category)}
          className="group type-tiny h-auto gap-2 rounded-none border border-border bg-background px-3 py-2 text-foreground opacity-40 transition-[border-color,opacity] duration-200 hover:border-accent hover:bg-background active:transform-none data-[selected=true]:bg-background data-[selected=true]:text-foreground data-[selected=true]:opacity-100"
        >
          <CategorySwatch category={category} className="grayscale group-data-[selected=true]:grayscale-0" />
          {PLAN_FILTER_LABELS[category]}
        </ToggleButton>
      ))}
    </div>
  );
}

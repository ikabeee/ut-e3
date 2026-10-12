"use client";

import { ToggleButton } from "@heroui/react";
import { CategorySwatch } from "@features/floor-plan/components/category-swatch";
import { FLOOR_PLAN_COPY, PLAN_FILTER_LABELS } from "@features/floor-plan/lib/floor-plan-copy";
import { PLAN_CATEGORIES } from "@features/floor-plan/lib/plan-places";
import type { PlanCategory } from "@features/floor-plan/lib/types";

interface PlanCategoryFiltersProps {
  visibleCategories: ReadonlySet<PlanCategory>;
  onToggle: (category: PlanCategory) => void;
}

/** Filtros por categoría, que también funcionan como leyenda (`.filters`). */
export function PlanCategoryFilters({ visibleCategories, onToggle }: Readonly<PlanCategoryFiltersProps>) {
  return (
    <div role="group" aria-label={FLOOR_PLAN_COPY.explorer.filtersLabel} className="flex flex-wrap gap-[6px]">
      {PLAN_CATEGORIES.map((category) => (
        <ToggleButton
          key={category}
          isSelected={visibleCategories.has(category)}
          onChange={() => onToggle(category)}
          className="toggle-button--filter group type-tiny pointer-coarse:min-h-11"
        >
          <CategorySwatch category={category} className="grayscale group-data-[selected=true]:grayscale-0" />
          {PLAN_FILTER_LABELS[category]}
        </ToggleButton>
      ))}
    </div>
  );
}

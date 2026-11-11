import { CategorySwatch } from "@features/floor-plan/components/category-swatch";
import { PLAN_CATEGORIES, PLAN_CATEGORY_LABELS } from "@features/floor-plan/lib/plan-places";

/** Leyenda del croquis del inicio (`.legend`). */
export function PlanLegend() {
  return (
    <ul className="type-tiny m-0 grid list-none grid-cols-2 gap-x-[14px] gap-y-2 p-0 pt-[14px] text-muted">
      {PLAN_CATEGORIES.map((category) => (
        <li key={category} className="flex items-center gap-2">
          <CategorySwatch category={category} />
          {PLAN_CATEGORY_LABELS[category]}
        </li>
      ))}
    </ul>
  );
}

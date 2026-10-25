import { cn } from "@heroui/react";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { PLAN_CATEGORIES, type PlanCategory } from "@features/floor-plan/lib/types";

const SWATCH_STYLES: Record<PlanCategory, string> = {
  team: "bg-accent",
  info: "border border-dashed border-foreground",
  act: "bg-accent opacity-35",
  srv: "bg-muted",
};

export function PlanLegend() {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-x-[14px] gap-y-2 p-0 pt-[14px] type-tiny text-muted">
      {PLAN_CATEGORIES.map((category) => (
        <li key={category} className="flex items-center gap-2">
          <span aria-hidden="true" className={cn("size-3 flex-none", SWATCH_STYLES[category])} />
          {FLOOR_PLAN_COPY.categoryLabels[category]}
        </li>
      ))}
    </ul>
  );
}

import { cn } from "@heroui/react";
import type { PlanCategory } from "@features/floor-plan/lib/types";

const SWATCH_STYLES: Record<PlanCategory, string> = {
  team: "bg-accent",
  info: "border border-dashed border-foreground",
  act: "bg-accent opacity-35",
  srv: "bg-muted",
};

/** Muestra de color de una categoría (leyenda y filtros). */
export function CategorySwatch({ category, className }: Readonly<{ category: PlanCategory; className?: string }>) {
  return <span aria-hidden="true" className={cn("size-3 flex-none", SWATCH_STYLES[category], className)} />;
}

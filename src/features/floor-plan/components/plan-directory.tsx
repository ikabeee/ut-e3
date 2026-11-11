"use client";

import { cn } from "@heroui/react";
import { groupItemsByCategory } from "@features/floor-plan/lib/plan-items";
import { PLAN_CATEGORY_LABELS } from "@features/floor-plan/lib/plan-places";
import type { PlanCategory, PlanItem } from "@features/floor-plan/lib/types";

interface PlanDirectoryProps {
  items: readonly PlanItem[];
  selectedId: string | null;
  visibleCategories: ReadonlySet<PlanCategory>;
  onSelect: (id: string) => void;
}

/** Directorio de stands y zonas agrupado por categoría (`.dir`). */
export function PlanDirectory({ items, selectedId, visibleCategories, onSelect }: Readonly<PlanDirectoryProps>) {
  return (
    <div className="flex max-h-[420px] flex-col gap-[14px] overflow-auto pr-1 [scrollbar-color:var(--border)_transparent] max-[900px]:max-h-none">
      {groupItemsByCategory(items).map(({ category, items: groupItems }) => (
        <div key={category} className="flex flex-col gap-1" hidden={!visibleCategories.has(category)}>
          <p className="type-tiny m-0 mb-1 text-muted">{PLAN_CATEGORY_LABELS[category]}</p>
          {groupItems.map((item) => {
            const isCurrent = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "grid cursor-pointer grid-cols-[38px_1fr_auto] items-center gap-[10px] border border-surface bg-transparent px-[10px] py-[9px] text-left text-foreground hover:border-accent",
                  isCurrent && "border-accent bg-accent text-background",
                )}
              >
                <span className={cn("font-mono text-xs font-bold text-accent", isCurrent && "text-background")}>
                  {item.code || "—"}
                </span>
                <span className="min-w-0 font-wide text-[11px] leading-[1.1] font-bold uppercase">{item.title}</span>
                <span className={cn("type-tiny text-muted", isCurrent && "text-background")}>{item.subtitle}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

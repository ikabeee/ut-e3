"use client";

import { useLayoutEffect, useRef } from "react";
import { PLAN_CATEGORY_LABELS } from "@features/floor-plan/lib/plan-places";
import type { PlanItem, TooltipAnchor } from "@features/floor-plan/lib/types";

const OFFSET = 14;
const EDGE = 8;

/** Etiqueta que sigue al puntero sobre el croquis (`.tip`); se voltea si no cabe. */
export function PlanTooltip({ item, anchor }: Readonly<{ item: PlanItem; anchor: TooltipAnchor }>) {
  const ref = useRef<HTMLDivElement>(null);

  // Se mide después de pintar el contenido y se voltea si se sale del croquis.
  useLayoutEffect(() => {
    const tip = ref.current;
    if (!tip) {
      return;
    }
    let x = anchor.x + OFFSET;
    let y = anchor.y + OFFSET;
    if (x + tip.offsetWidth > anchor.containerWidth - EDGE) {
      x = anchor.x - tip.offsetWidth - OFFSET;
    }
    if (y + tip.offsetHeight > anchor.containerHeight - EDGE) {
      y = anchor.y - tip.offsetHeight - OFFSET;
    }
    tip.style.transform = `translate(${x}px, ${y}px)`;
  }, [anchor, item]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 z-[3] flex max-w-[240px] flex-col gap-[3px] border border-accent bg-background px-[10px] py-2"
      style={{ transform: `translate(${anchor.x + OFFSET}px, ${anchor.y + OFFSET}px)` }}
    >
      <span className="type-tiny text-muted">
        {item.code ? `${item.code} · ` : ""}
        {PLAN_CATEGORY_LABELS[item.category]}
      </span>
      <b className="font-wide text-[13px] leading-[1.05] uppercase">{item.title}</b>
    </div>
  );
}

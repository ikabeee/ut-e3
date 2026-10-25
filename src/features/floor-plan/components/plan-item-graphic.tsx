"use client";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { cn } from "@heroui/react";
import type { PlanCategory, PlanItem, PlanRect, PlanSelection } from "@features/floor-plan/lib/types";

interface PlanItemGraphicProps {
  item: PlanItem;
  rect: PlanRect;
  selection: PlanSelection;
  touchRect?: PlanRect;
  strokeDasharray?: string;
  children: ReactNode;
}

interface CategoryPaint {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeDasharray?: string;
}

const CATEGORY_PAINT: Record<PlanCategory, CategoryPaint> = {
  team: { fill: "var(--accent)", fillOpacity: 0.2, stroke: "var(--accent)" },
  info: { fill: "var(--background)", fillOpacity: 1, stroke: "var(--foreground)", strokeDasharray: "3 3" },
  act: { fill: "var(--accent)", fillOpacity: 0.14, stroke: "var(--accent)" },
  srv: { fill: "var(--muted)", fillOpacity: 0.22, stroke: "var(--muted)" },
};

const SELECTED_FILL: CSSProperties = { fill: "var(--accent)", fillOpacity: 1 };

export function PlanItemGraphic({
  item,
  rect,
  selection,
  touchRect,
  strokeDasharray,
  children,
}: Readonly<PlanItemGraphicProps>) {
  const isSelected = selection.selectedId === item.id;
  const select = () => selection.onSelectItem(item.id);

  return (
    <>
      {touchRect ? <PlanTouchArea itemId={item.id} rect={touchRect} onSelect={select} /> : null}
      <g
        data-plan-item={item.id}
        role="button"
        tabIndex={0}
        aria-label={item.label}
        aria-current={isSelected ? "true" : undefined}
        onClick={select}
        onKeyDown={(event) => selectOnEnterOrSpace(event, select)}
        className={cn("group cursor-pointer", isSelected && "[&_text]:fill-background")}
      >
        <PlanItemBox category={item.category} rect={rect} isSelected={isSelected} strokeDasharray={strokeDasharray} />
        {children}
      </g>
    </>
  );
}

function PlanTouchArea({ itemId, rect, onSelect }: Readonly<{ itemId: string; rect: PlanRect; onSelect: () => void }>) {
  const [x, y, width, height] = rect;

  return (
    <rect
      data-plan-touch={itemId}
      aria-hidden="true"
      x={x}
      y={y}
      width={width}
      height={height}
      fill="transparent"
      onClick={onSelect}
      className="hidden pointer-coarse:block"
    />
  );
}

interface PlanItemBoxProps {
  category: PlanCategory;
  rect: PlanRect;
  isSelected: boolean;
  strokeDasharray?: string;
}

function PlanItemBox({ category, rect, isSelected, strokeDasharray }: Readonly<PlanItemBoxProps>) {
  const [x, y, width, height] = rect;
  const paint = CATEGORY_PAINT[category];

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={paint.fill}
      fillOpacity={paint.fillOpacity}
      stroke={paint.stroke}
      strokeWidth={1.5}
      strokeDasharray={strokeDasharray ?? paint.strokeDasharray}
      style={isSelected ? SELECTED_FILL : undefined}
      className="transition-[fill-opacity,fill] duration-150 group-hover:[fill-opacity:.45] motion-reduce:transition-none"
    />
  );
}

function selectOnEnterOrSpace(event: KeyboardEvent<SVGGElement>, select: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    select();
  }
}

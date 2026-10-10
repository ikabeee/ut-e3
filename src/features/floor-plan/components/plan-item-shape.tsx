"use client";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { cn } from "@heroui/react";
import type { PlanRect } from "@features/floor-plan/lib/types";

export interface PlanItemInteraction {
  isSelected: boolean;
  /** Atenuado por los filtros del croquis (no se puede seleccionar). */
  isHidden?: boolean;
  onSelect: () => void;
}

interface PlanItemShapeProps extends PlanItemInteraction {
  id: string;
  label: string;
  rect: PlanRect;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeDasharray?: string;
  /** Contenido extra dentro del grupo (textos, flecha de la entrada). */
  children: ReactNode;
}

const SELECTED_FILL: CSSProperties = { fill: "var(--accent)", fillOpacity: 1 };

/**
 * Stand o zona seleccionable del croquis: rectángulo con hover, selección (relleno azul y
 * texto negro) y filtro. Se activa con clic, Enter o Espacio.
 */
export function PlanItemShape({
  id,
  label,
  rect: [x, y, width, height],
  fill,
  fillOpacity,
  stroke,
  strokeDasharray,
  isSelected,
  isHidden = false,
  onSelect,
  children,
}: Readonly<PlanItemShapeProps>) {
  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <g
      data-plan-item={id}
      role="button"
      tabIndex={isHidden ? -1 : 0}
      aria-label={label}
      aria-current={isSelected ? "true" : undefined}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        "group cursor-pointer",
        isHidden && "pointer-events-none opacity-[.12]",
        isSelected && "[&_text]:fill-background",
      )}
    >
      <rect
        data-plan-fill=""
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={1.5}
        strokeDasharray={strokeDasharray}
        style={isSelected ? SELECTED_FILL : undefined}
        className="transition-[fill-opacity,fill,opacity] duration-150 group-hover:[fill-opacity:.45]"
      />
      {children}
    </g>
  );
}

"use client";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { cn } from "@heroui/react";
import type { PlanItemInteraction } from "@features/floor-plan/lib/plan-interaction";
import type { PlanRect } from "@features/floor-plan/lib/types";

interface PlanItemShapeProps extends PlanItemInteraction {
  id: string;
  label: string;
  rect: PlanRect;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeDasharray?: string;
  /** Área táctil invisible, más grande que el dibujo (`getTouchRects`); sólo responde al dedo. */
  touchRect?: PlanRect;
  /** Contenido extra dentro del grupo (textos, flecha de la entrada). */
  children: ReactNode;
}

const SELECTED_FILL: CSSProperties = { fill: "var(--accent)", fillOpacity: 1 };

/**
 * Stand o zona seleccionable del croquis: rectángulo con hover, selección (relleno azul y
 * texto negro) y filtro. Se activa con clic, Enter o Espacio. En pantallas táctiles un
 * rectángulo transparente (`touchRect`) agranda el área de toque sin cambiar el dibujo.
 */
export function PlanItemShape({
  id,
  label,
  rect: [x, y, width, height],
  fill,
  fillOpacity,
  stroke,
  strokeDasharray,
  touchRect,
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
    <>
      {/*
        Área táctil: hermana del grupo y no hija, para que el anillo de foco siga rodeando el
        dibujo. Sólo existe con dedo (`display: none` con mouse) y mientras los filtros no
        oculten el elemento. Es invisible para los lectores de pantalla: el botón es el grupo.
      */}
      {touchRect && !isHidden ? (
        <rect
          data-plan-touch={id}
          aria-hidden="true"
          x={touchRect[0]}
          y={touchRect[1]}
          width={touchRect[2]}
          height={touchRect[3]}
          fill="transparent"
          onClick={onSelect}
          className="hidden pointer-coarse:block"
        />
      ) : null}
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
    </>
  );
}

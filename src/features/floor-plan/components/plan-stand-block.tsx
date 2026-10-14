"use client";

import { FitSvgText } from "@features/floor-plan/components/fit-svg-text";
import { PlanItemGraphic } from "@features/floor-plan/components/plan-item-shape";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { getItemInteraction, type PlanSelection } from "@features/floor-plan/lib/plan-interaction";
import { getStandCells } from "@features/floor-plan/lib/plan-layouts";
import { splitStandName } from "@features/floor-plan/lib/plan-items";
import type { FloorPlanVariant, PlanRect, StandBlock } from "@features/floor-plan/lib/types";

interface PlanStandBlockProps {
  block: StandBlock;
  /** Tamaño del nombre dentro de cada stand (`standNameSize` del layout). */
  nameSize: number;
  variant: FloorPlanVariant;
  selection: PlanSelection;
  /** Áreas táctiles por código de stand (`getTouchRects`). */
  touchRects: ReadonlyMap<string, PlanRect>;
}

/**
 * Pasillo de stands: su nombre y una celda por stand con el código arriba y el nombre del
 * ocupante abajo, partido en dos renglones. Los stands de equipo van en azul; el resto punteado.
 */
export function PlanStandBlock({ block, nameSize, variant, selection, touchRects }: Readonly<PlanStandBlockProps>) {
  return (
    <g>
      <text
        x={block.labelAt[0]}
        y={block.labelAt[1]}
        fontSize={11}
        fill="var(--muted)"
        className="pointer-events-none font-mono"
      >
        {block.name}
      </text>
      {getStandCells(block).map(({ code, rect }) => {
        const item = selection.itemsById.get(code);
        const isTeam = item?.category === "team";
        const [x, y, width, height] = rect;
        const [firstLine, secondLine] = splitStandName(item?.title ?? "");

        const nameProps = {
          maxWidth: width - 14,
          x: x + 8,
          fontSize: nameSize,
          fontWeight: 500,
          fill: "var(--foreground)",
          className: "pointer-events-none font-mono",
        };

        return (
          <PlanItemGraphic
            key={code}
            id={code}
            // En el croquis interactivo el lector de pantalla también oye el nombre del ocupante.
            label={FLOOR_PLAN_COPY.drawing.standLabel(code, variant === "explorer" ? item?.title : undefined)}
            rect={rect}
            fill={isTeam ? "var(--accent)" : "var(--background)"}
            fillOpacity={isTeam ? 0.2 : 1}
            stroke={isTeam ? "var(--accent)" : "var(--foreground)"}
            strokeDasharray={isTeam ? undefined : "3 3"}
            touchRect={touchRects.get(code)}
            {...getItemInteraction(code, selection)}
          >
            <text
              x={x + 8}
              y={y + 18}
              fontSize={12}
              fontWeight={700}
              fill={isTeam ? "var(--accent)" : "var(--foreground)"}
              className="pointer-events-none font-mono"
            >
              {code}
            </text>
            <FitSvgText {...nameProps} y={y + height - 26}>
              {firstLine}
            </FitSvgText>
            {secondLine ? (
              <FitSvgText {...nameProps} y={y + height - 13}>
                {secondLine}
              </FitSvgText>
            ) : null}
          </PlanItemGraphic>
        );
      })}
    </g>
  );
}

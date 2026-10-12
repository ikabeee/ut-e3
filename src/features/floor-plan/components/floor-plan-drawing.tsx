"use client";

import { useMemo } from "react";
import { PlanDefs } from "@features/floor-plan/components/plan-defs";
import { PlanEntry } from "@features/floor-plan/components/plan-entry";
import { PlanFloor } from "@features/floor-plan/components/plan-floor";
import { PlanPublicArea } from "@features/floor-plan/components/plan-public-area";
import { PlanStandBlock } from "@features/floor-plan/components/plan-stand-block";
import { PlanZones } from "@features/floor-plan/components/plan-zones";
import type { PlanSelection } from "@features/floor-plan/lib/plan-interaction";
import { getTouchRects } from "@features/floor-plan/lib/plan-touch-areas";
import type { FloorPlanVariant, PlanLayout, PlanOrientation } from "@features/floor-plan/lib/types";

interface FloorPlanDrawingProps extends PlanSelection {
  layout: PlanLayout;
  orientation: PlanOrientation;
  variant: FloorPlanVariant;
}

/**
 * Contenido SVG del croquis: patrones, piso y muro, zonas, área de público, entrada y pasillos
 * de stands. El `<svg>` lo pone quien lo usa, porque el inicio y la página del croquis lo manejan
 * distinto.
 */
export function FloorPlanDrawing({ layout, orientation, variant, ...selection }: Readonly<FloorPlanDrawingProps>) {
  // Cada croquis de la página (resumen o explorador, horizontal o vertical) define sus patrones.
  const idPrefix = `plan-${variant}-${orientation}`;
  const patternIds = { hatch: `${idPrefix}-hatch`, dots: `${idPrefix}-dots` };
  const touchRects = useMemo(() => getTouchRects(layout), [layout]);
  const publicArea = <PlanPublicArea rect={layout.publicArea} hatchId={patternIds.hatch} />;
  // En el explorador el área de público queda debajo de las zonas; en el inicio, encima.
  const isExplorer = variant === "explorer";

  return (
    <>
      <PlanDefs ids={patternIds} dots={layout.dots} />
      <PlanFloor dotsId={patternIds.dots} dots={layout.dots} wall={layout.wall} />
      {isExplorer ? publicArea : null}
      <PlanZones zones={layout.zones} variant={variant} selection={selection} touchRects={touchRects} />
      {isExplorer ? null : publicArea}
      <PlanEntry layout={layout} variant={variant} selection={selection} touchRect={touchRects.get("entry")} />
      {layout.standBlocks.map((block) => (
        <PlanStandBlock
          key={block.prefix}
          block={block}
          nameSize={layout.standNameSize}
          variant={variant}
          selection={selection}
          touchRects={touchRects}
        />
      ))}
    </>
  );
}

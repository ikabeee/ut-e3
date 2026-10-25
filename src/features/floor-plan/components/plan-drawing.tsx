import { useMemo } from "react";
import { PlanEntry } from "@features/floor-plan/components/plan-entry";
import { PlanFloor } from "@features/floor-plan/components/plan-floor";
import { PlanStandBlock } from "@features/floor-plan/components/plan-stand-block";
import { PlanZones } from "@features/floor-plan/components/plan-zones";
import { getTouchRects } from "@features/floor-plan/lib/plan-touch-areas";
import type { PlanLayout, PlanSelection } from "@features/floor-plan/lib/types";

interface PlanDrawingProps {
  layout: PlanLayout;
  selection: PlanSelection;
}

export function PlanDrawing({ layout, selection }: Readonly<PlanDrawingProps>) {
  const touchRects = useMemo(() => getTouchRects(layout), [layout]);

  return (
    <>
      <PlanFloor layout={layout} />
      <PlanZones zones={layout.zones} selection={selection} touchRects={touchRects} />
      <PlanEntry layout={layout} selection={selection} touchRect={touchRects.get("entrance")} />
      {layout.standBlocks.map((block) => (
        <PlanStandBlock
          key={block.zone}
          block={block}
          nameSize={layout.standNameSize}
          selection={selection}
          touchRects={touchRects}
        />
      ))}
    </>
  );
}

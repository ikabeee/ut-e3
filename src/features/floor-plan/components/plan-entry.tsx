import { PlanItemGraphic } from "@features/floor-plan/components/plan-item-graphic";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import type { PlanLayout, PlanRect, PlanSelection } from "@features/floor-plan/lib/types";

interface PlanEntryProps {
  layout: Pick<PlanLayout, "entry" | "entryLabelAt" | "height">;
  selection: PlanSelection;
  touchRect?: PlanRect;
}

export function PlanEntry({ layout, selection, touchRect }: Readonly<PlanEntryProps>) {
  const item = selection.itemsById.get("entrance");
  const [x, y, width, height] = layout.entry;
  const center = x + width / 2;
  const arrowPath = `M${center} ${y + height - 8} V${y + 14} M${center - 12} ${y + 26} L${center} ${y + 14} L${center + 12} ${y + 26}`;

  return (
    <>
      {item ? (
        <PlanItemGraphic
          item={item}
          rect={layout.entry}
          selection={selection}
          touchRect={touchRect}
          strokeDasharray="5 4"
        >
          <path d={arrowPath} stroke="var(--accent)" strokeWidth={3} fill="none" />
        </PlanItemGraphic>
      ) : null}
      <text
        x={layout.entryLabelAt?.[0] ?? center}
        y={layout.entryLabelAt?.[1] ?? layout.height - 4}
        textAnchor="middle"
        fontSize={layout.entryLabelAt ? 11 : 10}
        fill="var(--accent)"
        className="pointer-events-none font-mono uppercase"
      >
        {FLOOR_PLAN_COPY.drawing.entry}
      </text>
    </>
  );
}

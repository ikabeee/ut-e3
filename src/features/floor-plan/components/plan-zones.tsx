import { FitSvgText } from "@features/floor-plan/components/fit-svg-text";
import { PlanItemGraphic } from "@features/floor-plan/components/plan-item-graphic";
import type { PlanLayout, PlanRect, PlanSelection } from "@features/floor-plan/lib/types";

interface PlanZonesProps {
  zones: PlanLayout["zones"];
  selection: PlanSelection;
  touchRects: ReadonlyMap<string, PlanRect>;
}

const DEFAULT_ZONE_FONT_SIZE = 18;

export function PlanZones({ zones, selection, touchRects }: Readonly<PlanZonesProps>) {
  return Object.entries(zones).map(([id, zone]) => {
    const item = selection.itemsById.get(id);

    if (!item || !zone) {
      return null;
    }

    const isActivity = item.category === "act";
    const [x, y, width] = zone.rect;
    const fontSize = zone.fontSize ?? DEFAULT_ZONE_FONT_SIZE;

    return (
      <PlanItemGraphic key={id} item={item} rect={zone.rect} selection={selection} touchRect={touchRects.get(id)}>
        <FitSvgText
          maxWidth={width - 18}
          x={x + 10}
          y={y + fontSize + 6}
          fontSize={fontSize}
          fontWeight={800}
          fill={isActivity ? "var(--accent)" : "var(--foreground)"}
          className="pointer-events-none font-wide uppercase"
        >
          {item.drawingName}
        </FitSvgText>
      </PlanItemGraphic>
    );
  });
}

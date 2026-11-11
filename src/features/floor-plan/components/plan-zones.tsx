import { FitSvgText } from "@features/floor-plan/components/fit-svg-text";
import { PlanItemGraphic } from "@features/floor-plan/components/plan-item-graphic";
import type { PlanLayout, PlanRect, PlanSelection } from "@features/floor-plan/lib/types";

interface PlanZonesProps {
  zones: PlanLayout["zones"];
  selection: PlanSelection;
  touchRects: ReadonlyMap<string, PlanRect>;
}

interface LabelPlacement {
  x: number;
  y: number;
  maxWidth: number;
  transform?: string;
}

const DEFAULT_ZONE_FONT_SIZE = 18;

export function PlanZones({ zones, selection, touchRects }: Readonly<PlanZonesProps>) {
  return Object.entries(zones).map(([id, zone]) => {
    const item = selection.itemsById.get(id);

    if (!item || !zone) {
      return null;
    }

    const isActivity = item.category === "act";
    const fontSize = zone.fontSize ?? DEFAULT_ZONE_FONT_SIZE;

    const label = zone.isLabelVertical
      ? placeVerticalLabel(zone.rect, fontSize)
      : placeHorizontalLabel(zone.rect, fontSize);

    return (
      <PlanItemGraphic key={id} item={item} rect={zone.rect} selection={selection} touchRect={touchRects.get(id)}>
        <FitSvgText
          {...label}
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

function placeVerticalLabel([x, y, , height]: PlanRect, fontSize: number): LabelPlacement {
  const baselineX = x + fontSize + 6;
  const startY = y + height - 10;

  return { x: baselineX, y: startY, maxWidth: height - 18, transform: `rotate(-90 ${baselineX} ${startY})` };
}

function placeHorizontalLabel([x, y, width]: PlanRect, fontSize: number): LabelPlacement {
  return { x: x + 10, y: y + fontSize + 6, maxWidth: width - 18 };
}

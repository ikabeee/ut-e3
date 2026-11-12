import type { ReactElement } from "react";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { MAP_EXTERIOR_RECT, MAP_HEIGHT, MAP_WALL, MAP_WIDTH } from "@features/floor-plan/lib/map-layout";
import type { StandZone } from "@features/floor-plan/lib/types";

/**
 * The top-left corner of each block, above its first row of stands: far enough
 * that the screen-space markers never cover the label at the fit scale.
 */
const BLOCK_LABEL_SPOTS: ReadonlyArray<readonly [StandZone, number, number]> = [
  ["T", 63, 20],
  ["C", 178, 173],
  ["A", 412, 173],
  ["D", 178, 441],
  ["B", 412, 441],
];

/** The static drawing of the map: ground, exterior area, the Edificio B wall and the block labels. */
export function MapDrawing(): ReactElement {
  const [exteriorX, exteriorY, exteriorWidth, exteriorHeight] = MAP_EXTERIOR_RECT;

  return (
    <g>
      <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} className="fill-surface" />
      <rect
        x={exteriorX}
        y={exteriorY}
        width={exteriorWidth}
        height={exteriorHeight}
        className="fill-background stroke-border"
      />
      <path d={MAP_WALL} className="fill-none stroke-foreground" strokeWidth={2} />
      {BLOCK_LABEL_SPOTS.map(([zone, x, y]) => (
        <text key={zone} x={x} y={y} textAnchor="start" className="fill-muted type-tiny">
          {FLOOR_PLAN_COPY.drawing.blockLabels[zone]}
        </text>
      ))}
    </g>
  );
}

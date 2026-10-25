import { getStandCells } from "@features/floor-plan/lib/plan-layouts";
import type { PlanLayout, PlanRect } from "@features/floor-plan/lib/types";

const TOUCH_MARGIN = 10;

interface Edges {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

type Interval = readonly [number, number];

export function getTouchRects(layout: PlanLayout): ReadonlyMap<string, PlanRect> {
  const targets: [string, PlanRect][] = [
    ...Object.entries(layout.zones).map(([id, zone]): [string, PlanRect] => [id, zone.rect]),
    ["entrance", layout.entry],
    ...layout.standBlocks.flatMap((block) =>
      getStandCells(block).map(({ code, rect }): [string, PlanRect] => [code, rect]),
    ),
  ];

  const obstacles = [...targets.map(([, rect]) => rect), layout.publicArea];
  const bounds: PlanRect = [0, 0, layout.width, layout.height];

  return new Map(
    targets.map(([id, rect]) => [
      id,
      expandWithinNeighbors(
        rect,
        obstacles.filter((obstacle) => obstacle !== rect),
        bounds,
      ),
    ]),
  );
}

function expandWithinNeighbors(rect: PlanRect, neighbors: readonly PlanRect[], bounds: PlanRect): PlanRect {
  const own = toEdges(rect);
  const limits = toEdges(bounds);
  const others = neighbors.map(toEdges);
  const ownX: Interval = [own.left, own.right];
  const ownY: Interval = [own.top, own.bottom];

  const [left, right] = growInterval(
    ownX,
    others.flatMap((other): Interval[] =>
      overlapsWithinMargin(ownY, [other.top, other.bottom]) ? [[other.left, other.right]] : [],
    ),
    [limits.left, limits.right],
  );

  const [top, bottom] = growInterval(
    ownY,
    others.flatMap((other): Interval[] =>
      overlapsWithinMargin(ownX, [other.left, other.right]) ? [[other.top, other.bottom]] : [],
    ),
    [limits.top, limits.bottom],
  );

  return [left, top, right - left, bottom - top];
}

function growInterval([start, end]: Interval, blockers: readonly Interval[], limits: Interval): Interval {
  let low = Math.max(limits[0], start - TOUCH_MARGIN);
  let high = Math.min(limits[1], end + TOUCH_MARGIN);

  for (const [blockerStart, blockerEnd] of blockers) {
    if (blockerStart >= end) high = Math.min(high, (end + blockerStart) / 2);

    if (blockerEnd <= start) low = Math.max(low, (blockerEnd + start) / 2);
  }

  return [low, high];
}

function overlapsWithinMargin([startA, endA]: Interval, [startB, endB]: Interval) {
  return startA - TOUCH_MARGIN < endB + TOUCH_MARGIN && startB - TOUCH_MARGIN < endA + TOUCH_MARGIN;
}

function toEdges([x, y, width, height]: PlanRect): Edges {
  return { left: x, top: y, right: x + width, bottom: y + height };
}

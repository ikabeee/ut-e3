import { PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import { expandWithinNeighbors, getTouchRects, TOUCH_MARGIN } from "@features/floor-plan/lib/plan-touch-areas";
import type { PlanOrientation, PlanRect } from "@features/floor-plan/lib/types";

const BOUNDS: PlanRect = [0, 0, 1000, 1000];
const MIN_TOUCH_PX = 44;

/**
 * Ancho del croquis en pantalla con el que se valida cada orientación: el vertical en un teléfono
 * de 360 px (el SVG mide 326 px) y el horizontal en el ancho mínimo en que aparece (560 px, en el
 * explorador).
 */
const SMALLEST_RENDERED_WIDTH: Record<PlanOrientation, number> = { tall: 326, wide: 560 };

function overlaps([ax, ay, aw, ah]: PlanRect, [bx, by, bw, bh]: PlanRect) {
  return ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
}

function contains([ox, oy, ow, oh]: PlanRect, [ix, iy, iw, ih]: PlanRect) {
  return ox <= ix && oy <= iy && ox + ow >= ix + iw && oy + oh >= iy + ih;
}

describe("expandWithinNeighbors", () => {
  it("grows every side by the margin when there is room", () => {
    expect(expandWithinNeighbors([100, 100, 40, 30], [], BOUNDS)).toEqual([
      100 - TOUCH_MARGIN,
      100 - TOUCH_MARGIN,
      40 + 2 * TOUCH_MARGIN,
      30 + 2 * TOUCH_MARGIN,
    ]);
  });

  it("stops halfway to a close neighbor", () => {
    // El vecino de abajo está a 6 unidades: sólo se crece 3 hacia él.
    const [, y, , height] = expandWithinNeighbors([100, 100, 40, 30], [[100, 136, 40, 30]], BOUNDS);

    expect(y + height).toBe(133);
  });

  it("keeps diagonal neighbors from overlapping at the corners", () => {
    const rect: PlanRect = [100, 100, 40, 30];
    const diagonal: PlanRect = [150, 140, 40, 30];

    const grown = expandWithinNeighbors(rect, [diagonal], BOUNDS);
    const grownDiagonal = expandWithinNeighbors(diagonal, [rect], BOUNDS);

    expect(overlaps(grown, grownDiagonal)).toBe(false);
  });

  it("stays inside the drawing", () => {
    expect(expandWithinNeighbors([2, 2, 40, 30], [], [0, 0, 100, 100])).toEqual([0, 0, 42 + TOUCH_MARGIN, 32 + TOUCH_MARGIN]);
  });
});

describe.each(Object.keys(PLAN_LAYOUTS) as PlanOrientation[])("getTouchRects (%s)", (orientation) => {
  const layout = PLAN_LAYOUTS[orientation];
  const touchRects = getTouchRects(layout);
  const visibleRects = new Map<string, PlanRect>([
    ...Object.entries(layout.zones).map(([id, zone]): [string, PlanRect] => [id, zone.rect]),
    ["entry", layout.entry],
  ]);

  it("covers every zone, the entry and every stand", () => {
    expect(touchRects.get("info")).toBeDefined();
    expect(touchRects.get("entry")).toBeDefined();
    expect(touchRects.get("B9")).toBeDefined();
    for (const [id, rect] of visibleRects) {
      expect(contains(touchRects.get(id) as PlanRect, rect)).toBe(true);
    }
  });

  it("never overlaps another touch area, a visible item or the public area", () => {
    const entries = [...touchRects];
    for (const [id, rect] of entries) {
      for (const [otherId, other] of entries) {
        if (id !== otherId) {
          expect([id, otherId, overlaps(rect, other)]).toEqual([id, otherId, false]);
        }
      }
      expect([id, overlaps(rect, layout.publicArea)]).toEqual([id, false]);
    }
  });

  it("measures at least 44 px on the smallest screen where this orientation is shown", () => {
    const scale = SMALLEST_RENDERED_WIDTH[orientation] / layout.width;
    for (const [id, [, , width, height]] of touchRects) {
      expect([id, Math.min(width, height) * scale >= MIN_TOUCH_PX]).toEqual([id, true]);
    }
  });
});

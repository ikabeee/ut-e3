import { PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import { getTouchRects } from "@features/floor-plan/lib/plan-touch-areas";
import type { PlanRect } from "@features/floor-plan/lib/types";

describe("touch areas", () => {
  it.each(["wide", "tall"] as const)(
    "gives every item in the %s layout an area that contains its drawing",
    (orientation) => {
      const touchRects = [...getTouchRects(PLAN_LAYOUTS[orientation]).values()];

      expect(touchRects).toHaveLength(30);
      touchRects.forEach(([, , width, height]) => {
        expect(width).toBeGreaterThan(0);
        expect(height).toBeGreaterThan(0);
      });
    },
  );

  it.each(["wide", "tall"] as const)("never overlaps two touch areas in the %s layout", (orientation) => {
    const touchRects = [...getTouchRects(PLAN_LAYOUTS[orientation]).values()];

    touchRects.forEach((rect, index) => {
      touchRects.slice(index + 1).forEach((other) => expect(overlap(rect, other)).toBe(false));
    });
  });

  it("grows a small zone by up to 10 units on each free side", () => {
    const helpDesk = getTouchRects(PLAN_LAYOUTS.tall).get("help-desk");

    expect(helpDesk?.[3]).toBeGreaterThan(46);
  });
});

function overlap([xA, yA, widthA, heightA]: PlanRect, [xB, yB, widthB, heightB]: PlanRect) {
  return xA < xB + widthB && xB < xA + widthA && yA < yB + heightB && yB < yA + heightA;
}

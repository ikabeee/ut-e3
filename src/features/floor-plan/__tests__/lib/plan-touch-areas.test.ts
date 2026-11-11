import { PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import { getTouchRects } from "@features/floor-plan/lib/plan-touch-areas";
import type { PlanRect } from "@features/floor-plan/lib/types";

const ORIENTATIONS = ["wide", "tall"] as const;

const MIN_TOUCH_SIDE = 56;

describe("touch areas", () => {
  it.each(ORIENTATIONS)("gives each of the 18 stands and 11 zones in the %s layout a touch area", (orientation) => {
    expect(getTouchRects(PLAN_LAYOUTS[orientation]).size).toBe(29);
  });

  it.each(ORIENTATIONS)(
    "makes every touch area in the %s layout at least 56 units wide and tall, 44 px on a 360 px screen",
    (orientation) => {
      const tooSmall = [...getTouchRects(PLAN_LAYOUTS[orientation])].flatMap(([id, [, , width, height]]) =>
        Math.min(width, height) < MIN_TOUCH_SIDE ? [id] : [],
      );

      expect(tooSmall).toEqual([]);
    },
  );

  it.each(ORIENTATIONS)("never overlaps two touch areas in the %s layout", (orientation) => {
    const touchRects = [...getTouchRects(PLAN_LAYOUTS[orientation]).values()];

    touchRects.forEach((rect, index) => {
      touchRects.slice(index + 1).forEach((other) => expect(overlap(rect, other)).toBe(false));
    });
  });

  it("grows a help center by up to 10 units on each free side", () => {
    const helpCenter = getTouchRects(PLAN_LAYOUTS.tall).get("help-center-1");

    expect(helpCenter?.[3]).toBeGreaterThan(60);
  });
});

function overlap([xA, yA, widthA, heightA]: PlanRect, [xB, yB, widthB, heightB]: PlanRect) {
  return xA < xB + widthB && xB < xA + widthA && yA < yB + heightB && yB < yA + heightA;
}

import { PLAN_LAYOUT } from "@features/floor-plan/lib/plan-layouts";
import { getTouchRects } from "@features/floor-plan/lib/plan-touch-areas";
import type { PlanRect } from "@features/floor-plan/lib/types";

const MIN_TOUCH_SIDE = 56;

describe("touch areas", () => {
  it("gives each of the 18 stands and 9 zones a touch area", () => {
    expect(getTouchRects(PLAN_LAYOUT).size).toBe(27);
  });

  it("makes every touch area at least 56 units wide and tall, 44 px on a 360 px screen", () => {
    const tooSmall = [...getTouchRects(PLAN_LAYOUT)].flatMap(([id, [, , width, height]]) =>
      Math.min(width, height) < MIN_TOUCH_SIDE ? [id] : [],
    );

    expect(tooSmall).toEqual([]);
  });

  it("never overlaps two touch areas", () => {
    const touchRects = [...getTouchRects(PLAN_LAYOUT).values()];

    touchRects.forEach((rect, index) => {
      touchRects.slice(index + 1).forEach((other) => expect(overlap(rect, other)).toBe(false));
    });
  });

  it("grows a help center by up to 10 units on each free side", () => {
    const helpCenter = getTouchRects(PLAN_LAYOUT).get("help-center-1");

    expect(helpCenter?.[3]).toBeGreaterThan(60);
  });
});

function overlap([xA, yA, widthA, heightA]: PlanRect, [xB, yB, widthB, heightB]: PlanRect) {
  return xA < xB + widthB && xB < xA + widthA && yA < yB + heightB && yB < yA + heightA;
}

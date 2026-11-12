import { findItemRect, getStandCells, PLAN_LAYOUT } from "@features/floor-plan/lib/plan-layouts";
import type { PlanLayout } from "@features/floor-plan/lib/types";

const STAND_CODES = [
  ...numberedCodes("A", 3),
  ...numberedCodes("B", 3),
  ...numberedCodes("C", 3),
  ...numberedCodes("D", 3),
  ...numberedCodes("T", 6),
];

const ZONE_IDS = [
  "stage",
  "kof",
  "mario-kart",
  "restrooms",
  "marketplace",
  "help-center-1",
  "help-center-2",
  "help-center-3",
  "help-center-4",
];

describe("plan layout", () => {
  it("places the 18 stands of blocks A to D and T", () => {
    const codes = PLAN_LAYOUT.standBlocks.flatMap((block) => getStandCells(block).map((cell) => cell.code));

    expect(codes.toSorted()).toEqual(STAND_CODES.toSorted());
  });

  it("numbers blocks A to D from S3 at the top down to S1", () => {
    ["A", "B", "C", "D"].forEach((zone) => {
      const [s1, s2, s3] = numberedCodes(zone, 3).map((code) => centerOf(PLAN_LAYOUT, code).y);

      expect(s3).toBeLessThan(s2);
      expect(s2).toBeLessThan(s1);
    });
  });

  it("finds the rectangle of every stand and zone", () => {
    [...STAND_CODES, ...ZONE_IDS].forEach((id) => expect(findItemRect(PLAN_LAYOUT, id)).not.toBeNull());
  });

  it("has no rear marketplace and no cafeteria", () => {
    expect(findItemRect(PLAN_LAYOUT, "rear-marketplace")).toBeNull();
    expect(findItemRect(PLAN_LAYOUT, "cafeteria")).toBeNull();
  });

  it("returns null for an id that is not in the plan", () => {
    expect(findItemRect(PLAN_LAYOUT, "ZE-S1")).toBeNull();
    expect(findItemRect(PLAN_LAYOUT, "entrance")).toBeNull();
  });
});

function numberedCodes(zone: string, count: number) {
  return Array.from({ length: count }, (_, index) => `Z${zone}-S${index + 1}`);
}

function centerOf(layout: PlanLayout, id: string) {
  const rect = findItemRect(layout, id);

  if (!rect) throw new Error(`${id} is missing from the plan`);

  const [x, y, width, height] = rect;

  return { x: x + width / 2, y: y + height / 2 };
}

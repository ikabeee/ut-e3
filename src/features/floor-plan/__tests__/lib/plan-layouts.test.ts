import { findItemRect, getStandCells, PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import type { PlanLayout } from "@features/floor-plan/lib/types";

const ORIENTATIONS = ["wide", "tall"] as const;

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
  "rear-marketplace",
  "marketplace",
  "cafeteria",
  "help-center-1",
  "help-center-2",
  "help-center-3",
  "help-center-4",
];

describe("plan layouts", () => {
  it.each(ORIENTATIONS)("places the 18 stands of blocks A to D and T in the %s layout", (orientation) => {
    const codes = PLAN_LAYOUTS[orientation].standBlocks.flatMap((block) =>
      getStandCells(block).map((cell) => cell.code),
    );

    expect(codes.toSorted()).toEqual(STAND_CODES.toSorted());
  });

  it("numbers blocks A to D from S1 at the rear of the lobby in the tall layout", () => {
    ["A", "B", "C", "D"].forEach((zone) => {
      const [first, second, third] = numberedCodes(zone, 3).map((code) => centerOf(PLAN_LAYOUTS.tall, code).y);

      expect(first).toBeLessThan(second);
      expect(second).toBeLessThan(third);
    });
  });

  it("rotates the tall plan 90 degrees counterclockwise for the wide layout", () => {
    const places = [...STAND_CODES, ...ZONE_IDS].map((id) => ({
      id,
      tall: centerOf(PLAN_LAYOUTS.tall, id),
      wide: centerOf(PLAN_LAYOUTS.wide, id),
    }));

    const misplaced = places.flatMap((a) =>
      places.flatMap((b) => (keepsRotatedOrder(a, b) ? [] : [`${a.id} / ${b.id}`])),
    );

    expect(misplaced).toEqual([]);
  });

  it.each(ORIENTATIONS)("finds the rectangle of every stand and zone in the %s layout", (orientation) => {
    const layout = PLAN_LAYOUTS[orientation];

    [...STAND_CODES, ...ZONE_IDS].forEach((id) => expect(findItemRect(layout, id)).not.toBeNull());
  });

  it("returns null for an id that is not in the plan", () => {
    expect(findItemRect(PLAN_LAYOUTS.wide, "ZE-S1")).toBeNull();
    expect(findItemRect(PLAN_LAYOUTS.wide, "entrance")).toBeNull();
  });
});

function numberedCodes(zone: string, count: number) {
  return Array.from({ length: count }, (_, index) => `Z${zone}-S${index + 1}`);
}

interface Point {
  x: number;
  y: number;
}

function centerOf(layout: PlanLayout, id: string): Point {
  const rect = findItemRect(layout, id);

  if (!rect) throw new Error(`${id} is missing from the plan`);

  const [x, y, width, height] = rect;

  return { x: x + width / 2, y: y + height / 2 };
}

interface Place {
  tall: Point;
  wide: Point;
}

function keepsRotatedOrder(a: Place, b: Place) {
  const isAboveInTall = a.tall.y < b.tall.y;
  const isLeftInTall = a.tall.x < b.tall.x;

  return (!isAboveInTall || a.wide.x < b.wide.x) && (!isLeftInTall || a.wide.y > b.wide.y);
}

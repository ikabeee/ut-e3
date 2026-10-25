import { findItemRect, getStandCells, PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";

const ORIENTATIONS = ["wide", "tall"] as const;

const ZONE_IDS = ["stage", "kof", "mario-kart", "marketplace", "help-desk", "restrooms", "rest-area", "entrance"];

describe("plan layouts", () => {
  it.each(ORIENTATIONS)("places the 18 team codes and the 4 info booths in the %s layout", (orientation) => {
    const codes = PLAN_LAYOUTS[orientation].standBlocks.flatMap((block) =>
      getStandCells(block).map((cell) => cell.code),
    );

    expect(codes).toHaveLength(22);
    expect(codes).toEqual(expect.arrayContaining(numberedCodes("A", 9)));
    expect(codes).toEqual(expect.arrayContaining(numberedCodes("B", 9)));
    expect(codes).toEqual(expect.arrayContaining(numberedCodes("C", 4)));
  });

  it.each(ORIENTATIONS)("numbers each block row by row from s1 in the %s layout", (orientation) => {
    const [blockCodes] = PLAN_LAYOUTS[orientation].standBlocks
      .map((block) => getStandCells(block).map((cell) => cell.code))
      .filter((codes) => codes.includes("ZA-S1"));

    expect(blockCodes).toEqual(numberedCodes("A", 9));
  });

  it.each(ORIENTATIONS)("finds the rectangle of every stand and zone in the %s layout", (orientation) => {
    const layout = PLAN_LAYOUTS[orientation];
    const ids = [...numberedCodes("A", 9), ...numberedCodes("B", 9), ...numberedCodes("C", 4), ...ZONE_IDS];

    ids.forEach((id) => expect(findItemRect(layout, id)).not.toBeNull());
  });

  it("returns null for an id that is not in the plan", () => {
    expect(findItemRect(PLAN_LAYOUTS.wide, "ZD-S1")).toBeNull();
  });
});

function numberedCodes(zone: string, count: number) {
  return Array.from({ length: count }, (_, index) => `Z${zone}-S${index + 1}`);
}

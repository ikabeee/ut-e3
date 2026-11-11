import { findItemRect, getStandCells, PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import { MOCK_GAMES } from "@features/games/lib/mock-games";

describe("plan layouts", () => {
  it.each(["wide", "tall"] as const)("places a stand for every game in the %s layout", (orientation) => {
    const codes = PLAN_LAYOUTS[orientation].standBlocks.flatMap((block) => getStandCells(block).map((cell) => cell.code));

    for (const game of MOCK_GAMES) {
      expect(codes).toContain(game.stand);
    }
    expect(codes).toEqual(expect.arrayContaining(["C1", "C2", "C3", "C4"]));
  });

  it("numbers the stands row by row", () => {
    const [blockA] = PLAN_LAYOUTS.wide.standBlocks;
    const cells = getStandCells(blockA);

    expect(cells[0]).toEqual({ code: "A1", rect: [40, 200, 76, 80] });
    expect(cells[3]).toEqual({ code: "A4", rect: [40, 290, 76, 80] });
    expect(cells[8]).toEqual({ code: "A9", rect: [212, 380, 76, 80] });
  });

  it("finds the rectangle of stands, zones and the entry", () => {
    expect(findItemRect(PLAN_LAYOUTS.wide, "B9")).toEqual([884, 380, 76, 80]);
    expect(findItemRect(PLAN_LAYOUTS.tall, "stage")).toEqual([30, 30, 340, 80]);
    expect(findItemRect(PLAN_LAYOUTS.wide, "entry")).toEqual([440, 520, 120, 60]);
    expect(findItemRect(PLAN_LAYOUTS.wide, "Z9")).toBeNull();
  });
});

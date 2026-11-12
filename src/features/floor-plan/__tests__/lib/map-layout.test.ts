import { formatStandCode } from "@features/games/lib/stand-code";
import {
  MAP_EXTERIOR_RECT,
  MAP_HEIGHT,
  MAP_WALL,
  MAP_WIDTH,
  STAND_MARKERS,
  ZONE_MARKERS,
} from "@features/floor-plan/lib/map-layout";

const STAND_CENTERS: Array<readonly [string, number, number, number]> = [
  ["T", 2, 63, 58],
  ["T", 4, 153, 58],
  ["T", 6, 243, 58],
  ["T", 1, 63, 120],
  ["T", 3, 153, 120],
  ["T", 5, 243, 120],
  ["C", 3, 178, 211],
  ["C", 2, 248, 211],
  ["C", 1, 318, 211],
  ["A", 3, 412, 211],
  ["A", 2, 482, 211],
  ["A", 1, 552, 211],
  ["D", 3, 178, 479],
  ["D", 2, 248, 479],
  ["D", 1, 318, 479],
  ["B", 3, 412, 479],
  ["B", 2, 482, 479],
  ["B", 1, 552, 479],
];

const EXPECTED_STANDS = STAND_CENTERS.map(([zone, number, x, y]) => [formatStandCode({ zone, number }), x, y] as const);

const EXPECTED_ZONES: Array<readonly [string, number, number]> = [
  ["restrooms", 43, 370],
  ["mario-kart", 103, 370],
  ["help-center-2", 80, 194],
  ["help-center-1", 80, 550],
  ["help-center-4", 696, 200],
  ["help-center-3", 696, 548],
  ["kof", 627, 370],
  ["stage", 699, 370],
  ["marketplace", 841, 373],
];

describe("map layout", () => {
  it("is a landscape map of 940 by 600 units", () => {
    expect(MAP_WIDTH).toBe(940);
    expect(MAP_HEIGHT).toBe(600);
    expect(MAP_WIDTH).toBeGreaterThan(MAP_HEIGHT);
  });

  it("draws the Edificio B outline with its inner wall", () => {
    expect(MAP_WALL).toBe("M10 10 H292 V156 H746 V590 H10 Z M10 156 H292");
  });

  it("keeps the marketplace side as an exterior area outside the wall", () => {
    expect([...MAP_EXTERIOR_RECT]).toEqual([752, 156, 178, 434]);
  });

  it("places the 18 stands of blocks T, C, A, D and B at their centers, in plan order", () => {
    expect(STAND_MARKERS.map((marker) => [marker.code, marker.x, marker.y])).toEqual(EXPECTED_STANDS);
  });

  it("gives every stand a unique code from the stand code of the games feature", () => {
    const codes = STAND_MARKERS.map((marker) => marker.code);

    expect(new Set(codes).size).toBe(18);
  });

  it("numbers block T following the reading order: 2, 4, 6 on the first row and 1, 3, 5 on the second", () => {
    const blockT = STAND_MARKERS.filter((marker) => marker.code.startsWith("ZT-"));

    expect(blockT.map((marker) => marker.code)).toEqual(["ZT-S2", "ZT-S4", "ZT-S6", "ZT-S1", "ZT-S3", "ZT-S5"]);
  });

  it.each(["C", "A", "D", "B"])("numbers block %s from 3 on the left to 1 on the right", (zone) => {
    const block = STAND_MARKERS.filter((marker) => marker.code.startsWith(`Z${zone}-`)).toSorted(
      (left, right) => left.x - right.x,
    );

    expect(block.map((marker) => marker.code)).toEqual([`Z${zone}-S3`, `Z${zone}-S2`, `Z${zone}-S1`]);
  });

  it("places the 9 zones at their centers", () => {
    expect(ZONE_MARKERS.map((marker) => [marker.id, marker.x, marker.y])).toEqual(EXPECTED_ZONES);
  });

  it("gives every zone a unique id", () => {
    expect(new Set(ZONE_MARKERS.map((marker) => marker.id)).size).toBe(9);
  });
});

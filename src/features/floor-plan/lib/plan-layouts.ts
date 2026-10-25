import type { PlanLayout, PlanOrientation, PlanRect, StandBlock, StandCell } from "@features/floor-plan/lib/types";
import { formatStandCode } from "@features/games/lib/stand-code";

export const WIDE_LAYOUT_MIN_WIDTH = 600;

export const INFO_BOOTH_ZONE = "C";

export const PLAN_LAYOUTS: Record<PlanOrientation, PlanLayout> = {
  wide: {
    width: 1000,
    height: 598,
    wall: "M440 580 H20 V20 H980 V580 H560",
    dots: [20, 980, 20, 580],
    zones: {
      kof: { rect: [40, 40, 250, 120] },
      stage: { rect: [330, 40, 340, 110], fontSize: 28 },
      "mario-kart": { rect: [710, 40, 250, 120] },
      marketplace: { rect: [40, 480, 290, 80] },
      "help-desk": { rect: [345, 480, 80, 80], fontSize: 14 },
      restrooms: { rect: [575, 480, 70, 80], fontSize: 14 },
      "rest-area": { rect: [660, 480, 300, 80] },
    },
    publicArea: [330, 156, 340, 50],
    entry: [440, 520, 120, 60],
    entryLabelAt: [500, 512],
    standBlocks: [
      { zone: "A", origin: [40, 200], step: [86, 90], size: [76, 80], columns: 3, rows: 3, labelAt: [40, 192] },
      { zone: "C", origin: [380, 250], step: [124, 90], size: [116, 80], columns: 2, rows: 2, labelAt: [380, 242] },
      { zone: "B", origin: [712, 200], step: [86, 90], size: [76, 80], columns: 3, rows: 3, labelAt: [712, 192] },
    ],
    standNameSize: 9,
  },
  tall: {
    width: 400,
    height: 900,
    wall: "M170 880 H10 V10 H390 V880 H230",
    dots: [10, 390, 10, 880],
    zones: {
      stage: { rect: [30, 30, 340, 80], fontSize: 24 },
      kof: { rect: [30, 160, 165, 70], fontSize: 16 },
      "mario-kart": { rect: [205, 160, 165, 70], fontSize: 16 },
      marketplace: { rect: [30, 760, 165, 56], fontSize: 15 },
      "rest-area": { rect: [205, 760, 165, 56], fontSize: 15 },
      "help-desk": { rect: [30, 822, 130, 56], fontSize: 14 },
      restrooms: { rect: [240, 822, 130, 56], fontSize: 14 },
    },
    publicArea: [30, 116, 340, 34],
    entry: [170, 822, 60, 58],
    entryLabelAt: null,
    standBlocks: [
      { zone: "A", origin: [30, 262], step: [118, 66], size: [104, 58], columns: 3, rows: 3, labelAt: [30, 254] },
      { zone: "C", origin: [30, 480], step: [86, 0], size: [78, 56], columns: 4, rows: 1, labelAt: [30, 472] },
      { zone: "B", origin: [30, 566], step: [118, 66], size: [104, 58], columns: 3, rows: 3, labelAt: [30, 558] },
    ],
    standNameSize: 10,
  },
};

export function getOrientationForWidth(width: number): PlanOrientation {
  return width >= WIDE_LAYOUT_MIN_WIDTH ? "wide" : "tall";
}

export function findItemRect(layout: PlanLayout, id: string): PlanRect | null {
  if (id === "entrance") {
    return layout.entry;
  }

  const zone = Object.entries(layout.zones).find(([zoneId]) => zoneId === id)?.[1];

  if (zone) {
    return zone.rect;
  }

  const cells = layout.standBlocks.flatMap(getStandCells);

  return cells.find((cell) => cell.code === id)?.rect ?? null;
}

export function getStandCells(block: StandBlock): StandCell[] {
  const [originX, originY] = block.origin;
  const [stepX, stepY] = block.step;
  const [width, height] = block.size;

  return Array.from({ length: block.rows * block.columns }, (_, index) => {
    const column = index % block.columns;
    const row = Math.floor(index / block.columns);
    const number = index + 1;
    const rect: PlanRect = [originX + column * stepX, originY + row * stepY, width, height];

    return { code: formatStandCode({ zone: block.zone, number }), number, rect };
  });
}

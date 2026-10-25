import type { PlanLayout, PlanOrientation, PlanRect, StandBlock, StandCell } from "@features/floor-plan/lib/types";
import { formatStandCode } from "@features/games/lib/stand-code";

export const WIDE_LAYOUT_MIN_WIDTH = 600;

export const PLAN_LAYOUTS: Record<PlanOrientation, PlanLayout> = {
  wide: {
    width: 1000,
    height: 600,
    wall: "M70 10 H352 V156 H806 V590 H70 Z M70 156 H352",
    dots: [10, 990, 10, 590],
    zones: {
      "rear-marketplace": { rect: [10, 10, 60, 580], fontSize: 16, isLabelVertical: true },
      restrooms: { rect: [78, 250, 50, 240], fontSize: 16, isLabelVertical: true },
      "mario-kart": { rect: [138, 300, 50, 140], fontSize: 14, isLabelVertical: true },
      "help-center-1": { rect: [110, 524, 60, 52], fontSize: 11 },
      "help-center-2": { rect: [110, 166, 60, 56], fontSize: 11 },
      kof: { rect: [662, 250, 50, 240], fontSize: 16, isLabelVertical: true },
      stage: { rect: [724, 250, 70, 240], fontSize: 20, isLabelVertical: true },
      "help-center-3": { rect: [726, 520, 60, 56], fontSize: 11 },
      "help-center-4": { rect: [726, 172, 60, 56], fontSize: 11 },
      marketplace: { rect: [812, 156, 178, 434], fontSize: 18, isLabelVertical: true },
      cafeteria: { rect: [812, 10, 178, 140], fontSize: 16 },
    },
    standBlocks: [
      {
        zone: "T",
        origin: [82, 30],
        step: [90, 62],
        size: [82, 56],
        columns: 3,
        rows: 2,
        labelAt: [82, 24],
        standNumbers: [2, 4, 6, 1, 3, 5],
      },
      { zone: "C", origin: [206, 176], step: [70, 0], size: [64, 70], columns: 3, rows: 1, labelAt: [206, 170] },
      { zone: "A", origin: [440, 176], step: [70, 0], size: [64, 70], columns: 3, rows: 1, labelAt: [440, 170] },
      { zone: "D", origin: [206, 444], step: [70, 0], size: [64, 70], columns: 3, rows: 1, labelAt: [206, 438] },
      { zone: "B", origin: [440, 444], step: [70, 0], size: [64, 70], columns: 3, rows: 1, labelAt: [440, 438] },
    ],
    standNameSize: 9,
  },
  tall: {
    width: 410,
    height: 870,
    wall: "M10 60 H400 V300 H282 V770 H10 Z M282 60 V300",
    dots: [10, 400, 10, 860],
    zones: {
      "rear-marketplace": { rect: [10, 10, 390, 50], fontSize: 16 },
      restrooms: { rect: [72, 68, 148, 48], fontSize: 16 },
      "mario-kart": { rect: [92, 126, 108, 46], fontSize: 12 },
      "help-center-1": { rect: [16, 96, 44, 60], fontSize: 11, isLabelVertical: true },
      "help-center-2": { rect: [228, 96, 44, 60], fontSize: 11, isLabelVertical: true },
      kof: { rect: [70, 646, 152, 48], fontSize: 16 },
      stage: { rect: [70, 702, 152, 60], fontSize: 18 },
      "help-center-3": { rect: [16, 690, 44, 60], fontSize: 11, isLabelVertical: true },
      "help-center-4": { rect: [228, 690, 44, 60], fontSize: 11, isLabelVertical: true },
      marketplace: { rect: [10, 776, 272, 84], fontSize: 15 },
      cafeteria: { rect: [288, 776, 112, 84], fontSize: 12 },
    },
    standBlocks: [
      { zone: "T", origin: [290, 82], step: [56, 72], size: [48, 64], columns: 2, rows: 3, labelAt: [290, 76] },
      { zone: "D", origin: [40, 190], step: [0, 66], size: [84, 58], columns: 1, rows: 3, labelAt: [40, 184] },
      { zone: "C", origin: [168, 190], step: [0, 66], size: [84, 58], columns: 1, rows: 3, labelAt: [168, 184] },
      { zone: "B", origin: [40, 406], step: [0, 66], size: [84, 58], columns: 1, rows: 3, labelAt: [40, 400] },
      { zone: "A", origin: [168, 406], step: [0, 66], size: [84, 58], columns: 1, rows: 3, labelAt: [168, 400] },
    ],
    standNameSize: 10,
  },
};

export function getOrientationForWidth(width: number): PlanOrientation {
  return width >= WIDE_LAYOUT_MIN_WIDTH ? "wide" : "tall";
}

export function findItemRect(layout: PlanLayout, id: string): PlanRect | null {
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
    const number = block.standNumbers?.[index] ?? index + 1;
    const rect: PlanRect = [originX + column * stepX, originY + row * stepY, width, height];

    return { code: formatStandCode({ zone: block.zone, number }), number, rect };
  });
}

import type { PlanLayout, PlanRect, StandBlock, StandCell } from "@features/floor-plan/lib/types";
import { formatStandCode } from "@features/games/lib/stand-code";

// The Edificio B drawn upright at every width: phones scroll it, desktop shows it beside the panel.
export const PLAN_LAYOUT: PlanLayout = {
  width: 410,
  height: 820,
  wall: "M10 10 H400 V250 H282 V720 H10 Z M282 10 V250",
  dots: [10, 400, 10, 810],
  zones: {
    restrooms: { rect: [72, 18, 148, 48], fontSize: 16 },
    "mario-kart": { rect: [92, 76, 108, 46], fontSize: 12 },
    "help-center-1": { rect: [16, 46, 44, 60], fontSize: 11, isLabelVertical: true },
    "help-center-2": { rect: [228, 46, 44, 60], fontSize: 11, isLabelVertical: true },
    kof: { rect: [70, 596, 152, 48], fontSize: 16 },
    stage: { rect: [70, 652, 152, 60], fontSize: 18 },
    "help-center-3": { rect: [16, 640, 44, 60], fontSize: 11, isLabelVertical: true },
    "help-center-4": { rect: [228, 640, 44, 60], fontSize: 11, isLabelVertical: true },
    marketplace: { rect: [10, 726, 390, 84], fontSize: 15 },
  },
  standBlocks: [
    { zone: "T", origin: [290, 32], step: [56, 72], size: [48, 64], columns: 2, rows: 3, labelAt: [290, 26] },
    {
      zone: "D",
      origin: [40, 140],
      step: [0, 66],
      size: [84, 58],
      columns: 1,
      rows: 3,
      labelAt: [40, 134],
      standNumbers: [3, 2, 1],
    },
    {
      zone: "C",
      origin: [168, 140],
      step: [0, 66],
      size: [84, 58],
      columns: 1,
      rows: 3,
      labelAt: [168, 134],
      standNumbers: [3, 2, 1],
    },
    {
      zone: "B",
      origin: [40, 356],
      step: [0, 66],
      size: [84, 58],
      columns: 1,
      rows: 3,
      labelAt: [40, 350],
      standNumbers: [3, 2, 1],
    },
    {
      zone: "A",
      origin: [168, 356],
      step: [0, 66],
      size: [84, 58],
      columns: 1,
      rows: 3,
      labelAt: [168, 350],
      standNumbers: [3, 2, 1],
    },
  ],
  standNameSize: 10,
};

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

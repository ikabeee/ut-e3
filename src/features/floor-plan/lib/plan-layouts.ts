import type { PlanLayout, PlanOrientation, PlanRect, StandCell, ViewBox } from "@features/floor-plan/lib/types";

/**
 * Geometría del croquis en coordenadas del SVG. `wide` se usa en pantallas anchas y
 * `tall` en teléfonos. Para mover una zona o un pasillo, cambia sus coordenadas aquí.
 */
export const PLAN_LAYOUTS: Record<PlanOrientation, PlanLayout> = {
  wide: {
    width: 1000,
    height: 598,
    wall: "M440 580 H20 V20 H980 V580 H560",
    dots: [20, 980, 20, 580],
    zones: {
      arena: { rect: [40, 40, 250, 120], label: "Arena" },
      stage: { rect: [330, 40, 340, 110], label: "Main Stage", fontSize: 28 },
      sorteos: { rect: [710, 40, 250, 120], label: "Premios" },
      food: { rect: [40, 480, 290, 80], label: "Comida" },
      info: { rect: [345, 480, 80, 80], label: "Info", fontSize: 14 },
      wc: { rect: [575, 480, 70, 80], label: "WC", fontSize: 14 },
      rest: { rect: [660, 480, 300, 80], label: "Descanso" },
    },
    publicArea: [330, 156, 340, 50],
    entry: [440, 520, 120, 60],
    entryLabelAt: [500, 512],
    standBlocks: [
      { prefix: "A", name: "PASILLO A", origin: [40, 200], step: [86, 90], size: [76, 80], columns: 3, rows: 3, labelAt: [40, 192] },
      { prefix: "C", name: "PASILLO CENTRAL", origin: [380, 250], step: [124, 90], size: [116, 80], columns: 2, rows: 2, labelAt: [380, 242] },
      { prefix: "B", name: "PASILLO B", origin: [712, 200], step: [86, 90], size: [76, 80], columns: 3, rows: 3, labelAt: [712, 192] },
    ],
    standNameSize: 9,
  },
  tall: {
    width: 400,
    height: 900,
    wall: "M170 880 H10 V10 H390 V880 H230",
    dots: [10, 390, 10, 880],
    zones: {
      stage: { rect: [30, 30, 340, 80], label: "Main Stage", fontSize: 24 },
      arena: { rect: [30, 160, 165, 70], label: "Arena", fontSize: 16 },
      sorteos: { rect: [205, 160, 165, 70], label: "Premios", fontSize: 16 },
      food: { rect: [30, 768, 165, 50], label: "Comida", fontSize: 15 },
      rest: { rect: [205, 768, 165, 50], label: "Descanso", fontSize: 15 },
      info: { rect: [30, 826, 130, 46], label: "Info", fontSize: 14 },
      wc: { rect: [240, 826, 130, 46], label: "WC", fontSize: 14 },
    },
    publicArea: [30, 116, 340, 34],
    entry: [170, 822, 60, 58],
    entryLabelAt: null,
    standBlocks: [
      { prefix: "A", name: "PASILLO A", origin: [30, 262], step: [118, 66], size: [104, 58], columns: 3, rows: 3, labelAt: [30, 254] },
      { prefix: "C", name: "PASILLO CENTRAL", origin: [30, 480], step: [86, 0], size: [78, 56], columns: 4, rows: 1, labelAt: [30, 472] },
      { prefix: "B", name: "PASILLO B", origin: [30, 566], step: [118, 66], size: [104, 58], columns: 3, rows: 3, labelAt: [30, 558] },
    ],
    standNameSize: 10,
  },
};

/** Stands de un bloque, numerados por filas: A1, A2, A3 en la primera fila... */
export function getStandCells(block: PlanLayout["standBlocks"][number]): StandCell[] {
  const [originX, originY] = block.origin;
  const [stepX, stepY] = block.step;
  const [width, height] = block.size;

  return Array.from({ length: block.rows * block.columns }, (_, index) => {
    const column = index % block.columns;
    const row = Math.floor(index / block.columns);
    return {
      code: `${block.prefix}${index + 1}`,
      rect: [originX + column * stepX, originY + row * stepY, width, height] as const,
    };
  });
}

/** Rectángulo de un stand o zona, para enfocarlo con el zoom. */
export function findItemRect(layout: PlanLayout, id: string): PlanRect | null {
  if (id === "entry") {
    return layout.entry;
  }
  const zone = layout.zones[id as keyof PlanLayout["zones"]];
  if (zone) {
    return zone.rect;
  }
  for (const block of layout.standBlocks) {
    const cell = getStandCells(block).find((candidate) => candidate.code === id);
    if (cell) {
      return cell.rect;
    }
  }
  return null;
}

export function getBaseViewBox(layout: PlanLayout): ViewBox {
  return { x: 0, y: 0, width: layout.width, height: layout.height };
}

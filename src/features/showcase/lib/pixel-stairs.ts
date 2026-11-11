export interface StairCell {
  x: number;
  y: number;
}

/** Diagonal bands of pixels that rise to the right: the background of the hero. */
export function buildStairCells(columns: number, rows: number): StairCell[] {
  const cells: StairCell[] = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      if (isStairCell(x, y)) cells.push({ x, y });
    }
  }

  return cells;
}

/** A single SVG `d` with one unit square per cell (one node instead of hundreds of `<rect>`). */
export function cellsToPath(cells: StairCell[]): string {
  return cells.map(({ x, y }) => `M${x} ${y}h1v1h-1z`).join("");
}

const BAND_PERIOD = 10;

const BAND_WIDTH = 4;

function isStairCell(x: number, y: number): boolean {
  return (x + y) % BAND_PERIOD < BAND_WIDTH;
}

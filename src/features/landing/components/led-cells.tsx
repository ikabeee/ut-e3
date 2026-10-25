import type { LedCell } from "@features/landing/lib/led-text";

interface LedCellsProps {
  cells: LedCell[];
  pitch: number;
  inset: number;
}

export function LedCells({ cells, pitch, inset }: Readonly<LedCellsProps>) {
  const size = pitch - inset * 2;

  return cells.map((cell) => (
    <rect
      key={`${cell.col}-${cell.row}`}
      x={cell.col * pitch + inset}
      y={cell.row * pitch + inset}
      width={size}
      height={size}
    />
  ));
}

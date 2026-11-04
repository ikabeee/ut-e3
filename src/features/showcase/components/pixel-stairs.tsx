import { cn } from "@heroui/react";
import { buildStairCells, cellsToPath } from "@features/showcase/lib/pixel-stairs";

const COLUMNS = 48;

const ROWS = 20;

const STAIRS_PATH = cellsToPath(buildStairCells(COLUMNS, ROWS));

/** Diagonal pixel steps that cover their container (decorative). */
export function PixelStairs({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${COLUMNS} ${ROWS}`}
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    >
      <path d={STAIRS_PATH} fill="currentColor" />
    </svg>
  );
}

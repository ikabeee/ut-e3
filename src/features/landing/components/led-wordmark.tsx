import { LedCells } from "@features/landing/components/led-cells";
import { layoutLedText } from "@features/landing/lib/led-text";

interface LedWordmarkProps {
  text: string;
  label: string;
  /** Empty space around each lit cell, from 0 (solid blocks) to under 0.5 (small dots). */
  cellInset?: number;
  className?: string;
}

const CELL_PITCH = 1;

const CELL_INSET = 0.08;

export function LedWordmark({ text, label, cellInset = CELL_INSET, className }: Readonly<LedWordmarkProps>) {
  const { cells, columns, rows } = layoutLedText(text);

  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${columns} ${rows}`} className={className}>
      <LedCells cells={cells} pitch={CELL_PITCH} inset={cellInset} />
    </svg>
  );
}

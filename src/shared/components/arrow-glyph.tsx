import { cn } from "@heroui/react";

const ARROW_GLYPHS = {
  ne: "↗",
  e: "→",
  s: "↓",
  w: "←",
} as const;

export type ArrowDirection = keyof typeof ARROW_GLYPHS;

interface ArrowGlyphProps {
  direction: ArrowDirection;
  className?: string;
}

/** Flecha de texto que se desplaza hacia su dirección al pasar el mouse por su contenedor. */
export function ArrowGlyph({ direction, className }: Readonly<ArrowGlyphProps>) {
  return (
    <span aria-hidden="true" data-direction={direction} className={cn("arrow-glyph", className)}>
      {ARROW_GLYPHS[direction]}
    </span>
  );
}

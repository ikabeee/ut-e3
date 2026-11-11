import { cn } from "@heroui/react";
import { LedWordmark } from "@features/landing/components/led-wordmark";
import { SOLID_CELL_INSET } from "@features/showcase/lib/led-insets";

interface PixelMarqueeProps {
  text: string;
  /** Height and fill of the letters. */
  textClassName: string;
  className?: string;
}

// Repetitions per copy, so one copy is wider than the screen.
const REPEATS = 3;

/**
 * Endless ribbon of LED letters: two identical copies and a track that moves half of its width (`animate-marquee`).
 * Decorative: the real text goes in a heading.
 */
export function PixelMarquee({ text, textClassName, className }: Readonly<PixelMarqueeProps>) {
  const copy = Array.from({ length: REPEATS }, () => text).join(" ");

  return (
    <div aria-hidden="true" className={cn("overflow-hidden", className)}>
      <div className="flex w-max animate-marquee">
        {[0, 1].map((index) => (
          <LedWordmark
            key={index}
            text={`${copy} `}
            label=""
            cellInset={SOLID_CELL_INSET}
            className={cn("block w-auto max-w-none shrink-0 pr-[0.5em]", textClassName)}
          />
        ))}
      </div>
    </div>
  );
}

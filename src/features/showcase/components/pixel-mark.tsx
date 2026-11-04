import { cn } from "@heroui/react";

// A 4x3 step of pixels next to small labels.
const MARK_PATH =
  "M2.1 .1h.8v.8h-.8zM3.1 .1h.8v.8h-.8zM1.1 1.1h.8v.8h-.8zM2.1 1.1h.8v.8h-.8zM.1 2.1h.8v.8h-.8zM1.1 2.1h.8v.8h-.8z";

/** Decorative pixel mark for labels and small titles. */
export function PixelMark({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 4 3"
      className={cn("inline-block h-[0.7em] w-auto shrink-0", className)}
    >
      <path d={MARK_PATH} fill="currentColor" />
    </svg>
  );
}

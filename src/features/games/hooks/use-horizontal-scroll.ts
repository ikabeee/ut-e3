import { useCallback, useRef } from "react";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

// Scrolls a native scroll track by whole items: the first item's width plus the track's column gap.
export function useHorizontalScroll<T extends HTMLElement>(itemsPerStep: number) {
  const ref = useRef<T>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const scrollByItems = useCallback(
    (direction: -1 | 1) => {
      const track = ref.current;
      const firstItem = track?.firstElementChild;

      if (!track || !(firstItem instanceof HTMLElement)) return;

      const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({
        left: direction * (firstItem.offsetWidth + gap) * itemsPerStep,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    },
    [itemsPerStep, prefersReducedMotion],
  );

  return { ref, scrollByItems };
}

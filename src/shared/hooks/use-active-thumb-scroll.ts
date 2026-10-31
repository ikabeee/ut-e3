import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

const THUMB_SCROLL_OFFSET = 8;

export function useActiveThumbScroll<T extends HTMLElement>(activeIndex: number) {
  const trackRef = useRef<T>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const track = trackRef.current;
    const thumb = track?.children[activeIndex];

    if (track && thumb instanceof HTMLElement) {
      track.scrollTo({
        left: thumb.offsetLeft - track.offsetLeft - THUMB_SCROLL_OFFSET,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  }, [activeIndex, prefersReducedMotion]);

  return trackRef;
}

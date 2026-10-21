import { useRef, useState } from "react";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/** Pasa de tarjeta en tarjeta una pista con `scroll-snap`; el scroll nativo sigue siendo la fuente de verdad. */
export function useCarousel(total: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  const getStep = (track: HTMLElement) => track.scrollWidth / total;

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;

    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    setIndex(atEnd ? total - 1 : Math.round(track.scrollLeft / getStep(track)));
  };

  const scrollByCards = (cards: number) => {
    const track = trackRef.current;
    if (!track) return;

    const step = getStep(track);
    const target = (Math.round(track.scrollLeft / step) + cards) * step;
    const maxLeft = track.scrollWidth - track.clientWidth;
    track.scrollTo({
      left: Math.min(Math.max(target, 0), maxLeft),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return {
    trackRef,
    index,
    onScroll,
    previous: () => scrollByCards(-1),
    next: () => scrollByCards(1),
  };
}

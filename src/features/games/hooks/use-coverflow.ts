import { useCallback, useState } from "react";
import { getInitialCoverflowIndex } from "@features/games/lib/coverflow-layout";
import { useSwipe } from "@shared/hooks/use-swipe";

/**
 * Caja actual del exhibidor 3D. A diferencia del carrusel, no es circular: se detiene en
 * la primera y en la última.
 */
export function useCoverflow(count: number) {
  const [current, setCurrent] = useState(() => getInitialCoverflowIndex(count));

  const goTo = useCallback((index: number) => setCurrent(Math.min(count - 1, Math.max(0, index))), [count]);
  const goPrevious = useCallback(() => setCurrent((index) => Math.max(0, index - 1)), []);
  const goNext = useCallback(() => setCurrent((index) => Math.min(count - 1, index + 1)), [count]);
  const swipeHandlers = useSwipe((direction) => (direction === 1 ? goNext() : goPrevious()));

  return {
    current,
    goTo,
    goPrevious,
    goNext,
    swipeHandlers,
    isFirst: current === 0,
    isLast: current === count - 1,
  };
}

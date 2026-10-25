import { useCallback, useState } from "react";
import { useSwipe } from "@features/games/hooks/use-swipe";
import { clampIndex } from "@features/games/lib/carousel-index";
import { getInitialCoverflowIndex } from "@features/games/lib/coverflow-layout";

const SWIPE_THRESHOLD = 40;

export function useCoverflow(count: number) {
  const [current, setCurrent] = useState(() => getInitialCoverflowIndex(count));

  const goTo = useCallback((index: number) => setCurrent(clampIndex(index, count)), [count]);
  const goPrevious = useCallback(() => setCurrent((index) => clampIndex(index - 1, count)), [count]);
  const goNext = useCallback(() => setCurrent((index) => clampIndex(index + 1, count)), [count]);
  const swipeHandlers = useSwipe((direction) => (direction === 1 ? goNext() : goPrevious()), SWIPE_THRESHOLD);

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

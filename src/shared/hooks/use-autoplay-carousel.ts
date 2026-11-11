import { useCallback, useState, type PointerEvent } from "react";
import { useAutoplayProgress } from "@shared/hooks/use-autoplay-progress";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";
import { useSwipe } from "@shared/hooks/use-swipe";
import { wrapIndex } from "@shared/lib/carousel-index";

export const AUTOPLAY_SLIDE_DURATION = 6500;

const SWIPE_THRESHOLD = 60;

export function useAutoplayCarousel(count: number) {
  const [current, setCurrent] = useState(0);
  const pause = useAutoplayPause();

  const goTo = useCallback((index: number) => setCurrent(wrapIndex(index, count)), [count]);
  const goBy = useCallback((step: number) => setCurrent((index) => wrapIndex(index + step, count)), [count]);
  const goNext = useCallback(() => goBy(1), [goBy]);
  const goPrevious = useCallback(() => goBy(-1), [goBy]);

  const progressBarRef = useAutoplayProgress({
    duration: AUTOPLAY_SLIDE_DURATION,
    isPaused: pause.isPaused,
    stepKey: current,
    onComplete: goNext,
  });

  const swipeHandlers = useSwipe(goBy, SWIPE_THRESHOLD);

  return {
    current,
    goTo,
    goNext,
    goPrevious,
    progressBarRef,
    swipeHandlers,
    pauseHandlers: pause.handlers,
  };
}

function useAutoplayPause() {
  const [isPointerResting, setIsPointerResting] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const restOnMouse = (isResting: boolean) => (event: PointerEvent) => {
    if (event.pointerType === "mouse") setIsPointerResting(isResting);
  };

  const restOnTouch = (isResting: boolean) => (event: PointerEvent) => {
    if (event.pointerType !== "mouse") setIsPointerResting(isResting);
  };

  return {
    isPaused: isPointerResting || hasFocusWithin || prefersReducedMotion,
    handlers: {
      onPointerEnter: restOnMouse(true),
      onPointerLeave: restOnMouse(false),
      onPointerDown: restOnTouch(true),
      onPointerUp: restOnTouch(false),
      onPointerCancel: restOnTouch(false),
      onFocus: () => setHasFocusWithin(true),
      onBlur: () => setHasFocusWithin(false),
    },
  };
}

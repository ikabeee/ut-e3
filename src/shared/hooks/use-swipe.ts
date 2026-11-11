import { useRef, type TouchEvent } from "react";

export type SwipeDirection = -1 | 1;

export function useSwipe(onSwipe: (direction: SwipeDirection) => void, threshold: number) {
  const startX = useRef<number | null>(null);

  return {
    onTouchStart: (event: TouchEvent) => {
      startX.current = event.touches[0]?.clientX ?? null;
    },
    onTouchEnd: (event: TouchEvent) => {
      if (startX.current === null) {
        return;
      }

      const deltaX = (event.changedTouches[0]?.clientX ?? startX.current) - startX.current;
      startX.current = null;

      if (Math.abs(deltaX) > threshold) {
        onSwipe(deltaX < 0 ? 1 : -1);
      }
    },
  };
}

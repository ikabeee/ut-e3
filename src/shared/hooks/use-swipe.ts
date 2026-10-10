import { useRef, type TouchEvent } from "react";

/** Dirección del gesto: `1` desliza hacia la izquierda (siguiente), `-1` hacia la derecha. */
export type SwipeDirection = -1 | 1;

/**
 * Detecta un deslizamiento horizontal con el dedo. Devuelve los manejadores táctiles
 * para el elemento que recibe el gesto.
 */
export function useSwipe(onSwipe: (direction: SwipeDirection) => void, threshold = 40) {
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

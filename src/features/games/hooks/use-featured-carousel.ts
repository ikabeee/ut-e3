import { useCallback, useState } from "react";
import { useAutoplayProgress } from "@shared/hooks/use-autoplay-progress";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";
import { useSwipe } from "@shared/hooks/use-swipe";
import { wrapIndex } from "@shared/lib/math";

/** Tiempo que se muestra cada juego antes de pasar al siguiente (ms). */
export const FEATURED_SLIDE_DURATION = 6500;
/** Desplazamiento mínimo del dedo para cambiar de juego. */
const SWIPE_THRESHOLD = 60;

interface SlideState {
  current: number;
  /** Diapositiva anterior: se mantiene montada mientras se desvanece. */
  previous: number | null;
}

/**
 * Carrusel de destacados: avance automático con barra de progreso, pausa al pasar el mouse
 * o con el foco dentro, flechas, miniaturas y deslizamiento. Es circular.
 */
export function useFeaturedCarousel(count: number) {
  const [{ current, previous }, setSlides] = useState<SlideState>({ current: 0, previous: null });
  const [isHovering, setIsHovering] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const goTo = useCallback(
    (index: number) =>
      setSlides((state) => {
        const next = wrapIndex(index, count);
        return next === state.current ? state : { current: next, previous: state.current };
      }),
    [count],
  );
  const goBy = useCallback(
    (step: number) => setSlides((state) => ({ current: wrapIndex(state.current + step, count), previous: state.current })),
    [count],
  );
  const goNext = useCallback(() => goBy(1), [goBy]);
  const goPrevious = useCallback(() => goBy(-1), [goBy]);

  const progressBarRef = useAutoplayProgress({
    duration: FEATURED_SLIDE_DURATION,
    isPaused: isHovering || hasFocusWithin || prefersReducedMotion,
    stepKey: current,
    onComplete: goNext,
  });

  const swipeHandlers = useSwipe((direction) => goBy(direction), SWIPE_THRESHOLD);

  return {
    current,
    previous,
    goTo,
    goNext,
    goPrevious,
    progressBarRef,
    swipeHandlers,
    pauseHandlers: {
      onMouseEnter: () => setIsHovering(true),
      onMouseLeave: () => setIsHovering(false),
      onFocus: () => setHasFocusWithin(true),
      onBlur: () => setHasFocusWithin(false),
    },
  };
}

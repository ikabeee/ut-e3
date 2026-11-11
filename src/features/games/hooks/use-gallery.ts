import { useCallback, useEffect, useState } from "react";
import { useSwipe } from "@shared/hooks/use-swipe";
import { wrapIndex } from "@shared/lib/math";

/** No se cambia de imagen con las flechas del teclado mientras se escribe. */
function isTypingTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest("input, textarea, [contenteditable='true']") !== null;
}

/**
 * Imagen activa de la galería: flechas, miniaturas, teclas ← → y deslizamiento.
 * La galería es circular.
 */
export function useGallery(shotCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  const showShot = useCallback((index: number) => setActiveIndex(wrapIndex(index, shotCount)), [shotCount]);
  const showPrevious = useCallback(() => setActiveIndex((index) => wrapIndex(index - 1, shotCount)), [shotCount]);
  const showNext = useCallback(() => setActiveIndex((index) => wrapIndex(index + 1, shotCount)), [shotCount]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }
      if (event.key === "ArrowRight") {
        showNext();
      } else if (event.key === "ArrowLeft") {
        showPrevious();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showNext, showPrevious]);

  const swipeHandlers = useSwipe((direction) => (direction === 1 ? showNext() : showPrevious()));

  return { activeIndex, showShot, showPrevious, showNext, swipeHandlers };
}

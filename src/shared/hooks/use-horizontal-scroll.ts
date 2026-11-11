import { useCallback, useRef } from "react";

/**
 * Desplaza horizontalmente un carrusel con scroll nativo (flechas anterior/siguiente).
 * Avanza `itemsPerStep` elementos, midiendo el ancho del primero más el espacio entre ellos.
 */
export function useHorizontalScroll<T extends HTMLElement>(itemsPerStep: number) {
  const ref = useRef<T>(null);

  const scrollByItems = useCallback(
    (direction: -1 | 1) => {
      const track = ref.current;
      const firstItem = track?.firstElementChild;
      if (!track || !(firstItem instanceof HTMLElement)) {
        return;
      }
      const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: direction * (firstItem.offsetWidth + gap) * itemsPerStep, behavior: "smooth" });
    },
    [itemsPerStep],
  );

  return { ref, scrollByItems };
}

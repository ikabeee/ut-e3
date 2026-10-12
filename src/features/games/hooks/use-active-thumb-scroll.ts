import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/** Espacio que se deja a la izquierda de la miniatura activa al desplazarse. */
const THUMB_SCROLL_OFFSET = 8;

/**
 * Desplaza la tira de miniaturas para que la activa quede a la vista (a la izquierda, con un
 * pequeño margen). Devuelve la ref del contenedor; cada hijo directo es una miniatura.
 * Con movimiento reducido salta sin animar.
 */
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

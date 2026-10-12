import { useCallback, type RefObject } from "react";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/** Token del tema con el color del parpadeo (`--utg-white` en `theme.css`). */
const FLASH_COLOR_TOKEN = "--utg-white";
const FLASH_TIMING: KeyframeAnimationOptions = { duration: 450, iterations: 6 };

/**
 * Parpadeo del diseño (`@keyframes flash { 50% { fill: white } }` con `steps(2)`): blanco
 * intermitente, 0.45 s por ciclo, 6 ciclos. Los valores de inicio y fin son los del rectángulo.
 * El color se lee del tema al animar para no depender de que el navegador acepte `var()` en los
 * keyframes de la Web Animations API.
 */
function getFlashKeyframes(element: Element): Keyframe[] {
  const fill = getComputedStyle(element).getPropertyValue(FLASH_COLOR_TOKEN).trim();
  return [
    { offset: 0, easing: "steps(2)" },
    { offset: 0.5, fill, fillOpacity: 1, easing: "steps(2)" },
  ];
}

/**
 * Hace parpadear un stand o zona para señalarlo (al elegirlo en el directorio o al llegar
 * desde un enlace). No anima si la persona prefiere reducir el movimiento.
 */
export function usePlanFlash(containerRef: RefObject<HTMLElement | null>) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return useCallback(
    (id: string) => {
      if (prefersReducedMotion) {
        return;
      }
      const container = containerRef.current;
      // Los ids son códigos de stand ("A1") o de zona ("stage"): no requieren escaparse.
      const shapes = container?.querySelectorAll<SVGRectElement>(`[data-plan-item="${id}"] [data-plan-fill]`);
      if (!container || !shapes?.length || typeof shapes[0].animate !== "function") {
        return;
      }
      const keyframes = getFlashKeyframes(container);
      shapes.forEach((shape) => shape.animate(keyframes, FLASH_TIMING));
    },
    [containerRef, prefersReducedMotion],
  );
}

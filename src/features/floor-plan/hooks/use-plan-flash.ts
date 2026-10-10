import { useCallback, type RefObject } from "react";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/**
 * Parpadeo del diseño (`@keyframes flash { 50% { fill: white } }` con `steps(2)`): blanco
 * intermitente, 0.45 s por ciclo, 6 ciclos. Los valores de inicio y fin son los del rectángulo.
 */
const FLASH_KEYFRAMES: Keyframe[] = [
  { offset: 0, easing: "steps(2)" },
  { offset: 0.5, fill: "#ffffff", fillOpacity: 1, easing: "steps(2)" },
];
const FLASH_TIMING: KeyframeAnimationOptions = { duration: 450, iterations: 6 };

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
      // Los ids son códigos de stand ("A1") o de zona ("stage"): no requieren escaparse.
      const shapes = containerRef.current?.querySelectorAll<SVGRectElement>(
        `[data-plan-item="${id}"] [data-plan-fill]`,
      );
      shapes?.forEach((shape) => {
        if (typeof shape.animate === "function") {
          shape.animate(FLASH_KEYFRAMES, FLASH_TIMING);
        }
      });
    },
    [containerRef, prefersReducedMotion],
  );
}

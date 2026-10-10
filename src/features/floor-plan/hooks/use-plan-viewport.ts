import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampViewBox,
  easeOutCubic,
  getViewBoxCenter,
  getZoomPercent,
  interpolateViewBox,
  zoomViewBox,
  type Point,
} from "@features/floor-plan/lib/plan-viewport";
import type { ViewBox } from "@features/floor-plan/lib/types";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/** Duración de las animaciones de la vista (ms). */
export const VIEWPORT_ANIMATION_MS = { focus: 480, zoomStep: 260 } as const;

/** Cada clic en + o − acerca o aleja 1.5 veces. */
const ZOOM_STEP = 1.5;

/**
 * Vista (viewBox) de un croquis con zoom y desplazamiento, animada salvo que la persona
 * prefiera reducir el movimiento.
 */
export function usePlanViewport(base: ViewBox) {
  const [viewBox, setViewBoxState] = useState(base);
  const viewBoxRef = useRef(base);
  const frameRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const stopAnimation = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const setViewBox = useCallback(
    (next: ViewBox) => {
      const clamped = clampViewBox(next, base);
      viewBoxRef.current = clamped;
      setViewBoxState(clamped);
    },
    [base],
  );

  const animateTo = useCallback(
    (target: ViewBox, duration: number = VIEWPORT_ANIMATION_MS.focus) => {
      stopAnimation();
      if (prefersReducedMotion) {
        setViewBox(target);
        return;
      }
      const from = viewBoxRef.current;
      // El tiempo se mide desde el primer cuadro para no depender del reloj de quien llama.
      let startedAt: number | null = null;
      const step = (now: number) => {
        startedAt ??= now;
        const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
        setViewBox(interpolateViewBox(from, target, easeOutCubic(progress)));
        frameRef.current = progress < 1 ? requestAnimationFrame(step) : null;
      };
      frameRef.current = requestAnimationFrame(step);
    },
    [prefersReducedMotion, setViewBox, stopAnimation],
  );

  /** Zoom inmediato alrededor de un punto (rueda del mouse y pellizco). */
  const zoomAt = useCallback(
    (factor: number, point: Point) => {
      stopAnimation();
      setViewBox(zoomViewBox(viewBoxRef.current, factor, point, base));
    },
    [base, setViewBox, stopAnimation],
  );

  /** Zoom animado desde el centro (botones + y −). */
  const zoomStep = useCallback(
    (direction: 1 | -1) => {
      const current = viewBoxRef.current;
      const factor = direction === 1 ? ZOOM_STEP : 1 / ZOOM_STEP;
      animateTo(zoomViewBox(current, factor, getViewBoxCenter(current), base), VIEWPORT_ANIMATION_MS.zoomStep);
    },
    [animateTo, base],
  );

  const pan = useCallback(
    (deltaX: number, deltaY: number) => {
      const current = viewBoxRef.current;
      setViewBox({ ...current, x: current.x + deltaX, y: current.y + deltaY });
    },
    [setViewBox],
  );

  const reset = useCallback(() => animateTo(base), [animateTo, base]);

  useEffect(() => stopAnimation, [stopAnimation]);

  return {
    viewBox,
    /** Vista actual sin esperar al render (para los gestos). */
    viewBoxRef,
    zoomPercent: getZoomPercent(viewBox, base),
    animateTo,
    zoomAt,
    zoomStep,
    pan,
    reset,
    stopAnimation,
  };
}

export type PlanViewport = ReturnType<typeof usePlanViewport>;

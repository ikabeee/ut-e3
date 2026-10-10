import { useEffect, useRef } from "react";

interface AutoplayOptions {
  /** Duración de cada paso (ms). */
  duration: number;
  /** Congela el avance (mouse encima, foco dentro o movimiento reducido). */
  isPaused: boolean;
  /** Cambia cuando empieza un paso nuevo (por ejemplo, el índice actual). */
  stepKey: number;
  onComplete: () => void;
}

/**
 * Avance automático con barra de progreso. La barra se actualiza directo en el DOM en cada
 * cuadro (sin renders de React); devuelve la ref que debe recibir el elemento de la barra.
 */
export function useAutoplayProgress({ duration, isPaused, stepKey, onComplete }: AutoplayOptions) {
  const barRef = useRef<HTMLElement | null>(null);
  const progress = useRef(0);
  const lastStepKey = useRef(stepKey);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (lastStepKey.current !== stepKey) {
      lastStepKey.current = stepKey;
      progress.current = 0;
    }
    let startedAt: number | null = null;
    let frame = 0;

    const tick = (now: number) => {
      startedAt ??= now - progress.current * duration;
      if (isPaused) {
        startedAt = now - progress.current * duration;
      } else {
        progress.current = Math.min(1, (now - startedAt) / duration);
        if (barRef.current) {
          barRef.current.style.width = `${progress.current * 100}%`;
        }
        if (progress.current >= 1) {
          progress.current = 0;
          onCompleteRef.current();
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, isPaused, stepKey]);

  return barRef;
}

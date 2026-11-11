import { useEffect, useRef } from "react";

interface AutoplayOptions {
  duration: number;
  isPaused: boolean;
  stepKey: number;
  onComplete: () => void;
}

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

    if (isPaused) {
      return;
    }

    let startedAt: number | null = null;
    let frame = 0;

    const tick = (now: number) => {
      startedAt ??= now - progress.current * duration;
      progress.current = Math.min(1, (now - startedAt) / duration);

      if (barRef.current) {
        barRef.current.style.width = `${progress.current * 100}%`;
      }

      if (progress.current >= 1) {
        progress.current = 0;
        onCompleteRef.current();

        return;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [duration, isPaused, stepKey]);

  return barRef;
}

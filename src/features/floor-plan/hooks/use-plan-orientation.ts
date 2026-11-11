import { useEffect, useRef, useState, type RefObject } from "react";
import { getOrientationForWidth } from "@features/floor-plan/lib/plan-layouts";
import type { PlanOrientation } from "@features/floor-plan/lib/types";

export function usePlanOrientation(): [RefObject<HTMLDivElement | null>, PlanOrientation] {
  const containerRef = useRef<HTMLDivElement>(null);
  const [orientation, setOrientation] = useState<PlanOrientation>("tall");

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setOrientation(getOrientationForWidth(entry.contentRect.width));
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return [containerRef, orientation];
}

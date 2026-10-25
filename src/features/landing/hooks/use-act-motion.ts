import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

export type MotionState = "idle" | "played";

const ACT_ATTRIBUTE = "data-act";

const VISIBLE_SHARE = 0.35;

export function useActMotion<Container extends HTMLElement>() {
  const containerRef = useRef<Container>(null);
  const [playedActs, setPlayedActs] = useState<ReadonlySet<string>>(new Set());
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const container = containerRef.current;

    if (!container || prefersReducedMotion) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entered = entries.filter((entry) => entry.isIntersecting);

        entered.forEach((entry) => observer.unobserve(entry.target));
        setPlayedActs((played) => new Set([...played, ...entered.flatMap(actIdOf)]));
      },
      { threshold: VISIBLE_SHARE },
    );

    container.querySelectorAll(`[${ACT_ATTRIBUTE}]`).forEach((act) => observer.observe(act));

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  function motionOf(actId: string): MotionState {
    return prefersReducedMotion || playedActs.has(actId) ? "played" : "idle";
  }

  return { containerRef, motionOf };
}

function actIdOf(entry: IntersectionObserverEntry) {
  const actId = entry.target.getAttribute(ACT_ATTRIBUTE);

  return actId ? [actId] : [];
}

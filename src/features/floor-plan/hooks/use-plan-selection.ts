import { useEffect, useEffectEvent, useState, type RefObject } from "react";
import { getItemIdFromHash } from "@features/floor-plan/lib/floor-plan-links";
import type { PlanItem } from "@features/floor-plan/lib/types";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

export const DEFAULT_SELECTED_ID = "zA-s1";

export function usePlanSelection(items: readonly PlanItem[], sectionRef: RefObject<HTMLElement | null>) {
  const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED_ID);
  const prefersReducedMotion = usePrefersReducedMotion();

  const scrollToSection = useEffectEvent(() => {
    sectionRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  });

  useEffect(() => {
    const selectFromHash = () => {
      const itemId = getItemIdFromHash(window.location.hash);
      const hashItem = items.find((item) => item.id === itemId);

      if (hashItem) {
        setSelectedId(hashItem.id);
        scrollToSection();
      }
    };

    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);

    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [items]);

  return { selectedId, selectItem: setSelectedId };
}

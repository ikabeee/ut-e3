import { useEffect, useEffectEvent, useState, type RefObject } from "react";
import { getItemIdFromHash } from "@features/floor-plan/lib/floor-plan-links";
import type { PlanItem, ZoneId } from "@features/floor-plan/lib/types";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

export const DEFAULT_SELECTED_ID = "ZA-S1";

// While the stands have no game yet, the plan opens on the stage instead of an empty stand.
const NO_GAMES_SELECTED_ID: ZoneId = "stage";

export function usePlanSelection(items: readonly PlanItem[], sectionRef: RefObject<HTMLElement | null>) {
  const [selectedId, setSelectedId] = useState(() => pickInitialId(items));
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

function pickInitialId(items: readonly PlanItem[]): string {
  const defaultItem = items.find((item) => item.id === DEFAULT_SELECTED_ID);

  return defaultItem?.cover ? DEFAULT_SELECTED_ID : NO_GAMES_SELECTED_ID;
}

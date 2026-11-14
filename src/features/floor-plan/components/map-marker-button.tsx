"use client";

import type { ReactElement, ReactNode } from "react";
import type { MapItem } from "@features/floor-plan/lib/plan-items";
import type { MapPoint } from "@features/floor-plan/lib/map-viewport";

interface MapMarkerButtonProps {
  item: MapItem;
  point: MapPoint;
  selected: boolean;
  onSelect: (id: string) => void;
  children: ReactNode;
}

/** Shared marker shell: positions the button on the map and exposes its pressed state. */
export function MapMarkerButton({
  item,
  point,
  selected,
  onSelect,
  children,
}: Readonly<MapMarkerButtonProps>): ReactElement {
  return (
    <button
      type="button"
      aria-label={item.label}
      aria-pressed={selected}
      onClick={() => onSelect(item.id)}
      style={{ left: point.x, top: point.y }}
      className="touch-target absolute flex -translate-1/2 flex-col items-center"
    >
      {children}
    </button>
  );
}

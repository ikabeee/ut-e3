"use client";

import type { ReactElement } from "react";
import type { MapItem } from "@features/floor-plan/lib/plan-items";
import type { MapPoint } from "@features/floor-plan/lib/map-viewport";
import type { ZoneId } from "@features/floor-plan/lib/types";
import { ZoneIcon } from "@features/floor-plan/components/zone-icon";

interface ZoneMarkerProps {
  item: MapItem;
  point: MapPoint;
  selected: boolean;
  compact: boolean;
  onSelect: (id: string) => void;
}

/** A zone of the map: a foreground circle with its icon and its name below. */
export function ZoneMarker({ item, point, selected, compact, onSelect }: Readonly<ZoneMarkerProps>): ReactElement {
  return (
    <button
      type="button"
      aria-label={item.label}
      aria-pressed={selected}
      onClick={() => onSelect(item.id)}
      style={{ left: point.x, top: point.y }}
      className="touch-target absolute flex -translate-1/2 flex-col items-center"
    >
      {compact ? compactDot(item, selected) : fullMarker(item, selected)}
    </button>
  );
}

function compactDot(item: MapItem, selected: boolean): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={`flex size-5 items-center justify-center rounded-full bg-foreground text-background ${selected ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
    >
      <ZoneIcon id={zoneIdOf(item)} size={12} />
    </span>
  );
}

function fullMarker(item: MapItem, selected: boolean): ReactElement {
  const ring = selected ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : "";

  return (
    <>
      <span
        aria-hidden="true"
        className={`flex size-12 items-center justify-center rounded-full bg-foreground text-background ${ring}`}
      >
        <ZoneIcon id={zoneIdOf(item)} size={24} />
      </span>
      <span className="mt-1 bg-background px-1 text-center type-tiny text-muted">{item.shortName}</span>
    </>
  );
}

function zoneIdOf(item: MapItem): ZoneId {
  // SAFETY: zone items always carry a zone id; stands never reach this marker.
  return item.id as ZoneId;
}

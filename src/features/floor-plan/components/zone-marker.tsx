"use client";

import type { ReactElement } from "react";
import type { MapItem } from "@features/floor-plan/lib/plan-items";
import type { MapPoint } from "@features/floor-plan/lib/map-viewport";
import type { ZoneId } from "@features/floor-plan/lib/types";
import { MapMarkerButton } from "@features/floor-plan/components/map-marker-button";
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
    <MapMarkerButton item={item} point={point} selected={selected} onSelect={onSelect}>
      {compact ? compactDot(item, selected) : fullMarker(item, selected)}
    </MapMarkerButton>
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
  return (
    <>
      <span
        aria-hidden="true"
        className={`flex size-12 items-center justify-center rounded-full bg-paper text-background shadow-[0_0_0_4px_rgba(0,0,0,0.65)] ${selected ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
      >
        <ZoneIcon id={zoneIdOf(item)} size={24} />
      </span>
      <span className="mt-[7px] text-center font-mono text-[11px] leading-[13px] text-paper uppercase">
        {item.shortName}
      </span>
      {item.subline ? (
        <span className="mt-0.5 text-center font-mono text-[10px]/3 text-muted">{item.subline}</span>
      ) : null}
    </>
  );
}

function zoneIdOf(item: MapItem): ZoneId {
  // SAFETY: zone items always carry a zone id; stands never reach this marker.
  return item.id as ZoneId;
}

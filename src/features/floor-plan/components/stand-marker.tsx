"use client";

import Image from "next/image";
import type { CSSProperties, ReactElement } from "react";
import type { MapItem } from "@features/floor-plan/lib/plan-items";
import { gameInitials } from "@features/floor-plan/lib/game-initials";
import { NAME_SCALE, isCompact, type MapPoint } from "@features/floor-plan/lib/map-viewport";
import { MapMarkerButton } from "@features/floor-plan/components/map-marker-button";

const COVER_SIZE = 52;

/** The map spacing between two neighbor stands, in map units. */
const STAND_SPACING = 70;

interface StandMarkerProps {
  item: MapItem;
  point: MapPoint;
  scale: number;
  selected: boolean;
  onSelect: (id: string) => void;
}

/** A stand of the map: its game cover, its initials or an empty circle, with its code badge and game name. */
export function StandMarker({ item, point, scale, selected, onSelect }: Readonly<StandMarkerProps>): ReactElement {
  return (
    <MapMarkerButton item={item} point={point} selected={selected} onSelect={onSelect}>
      {isCompact(scale) ? compactDot(item) : fullMarker(item, selected, scale)}
    </MapMarkerButton>
  );
}

function compactDot(item: MapItem): ReactElement {
  if (item.coverSrc) {
    return (
      <Image
        src={item.coverSrc}
        alt=""
        width={22}
        height={22}
        className="size-[22px] rounded-full border border-foreground object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={item.gameName ? "size-[22px] rounded-full bg-accent" : "size-[22px] rounded-full bg-surface"}
    />
  );
}

function fullMarker(item: MapItem, selected: boolean, scale: number): ReactElement {
  return (
    <>
      {markerCircle(item, selected)}
      <span className="relative -mt-2 bg-background px-1 type-tiny font-mono text-foreground">{item.code}</span>
      {scale >= NAME_SCALE && item.gameName ? (
        <span style={nameStyle(scale)} className="mt-0.5 truncate bg-background px-1 text-center type-tiny text-muted">
          {item.gameName}
        </span>
      ) : null}
    </>
  );
}

/** One line, truncated: never wider than the on-screen spacing between two stands. */
function nameStyle(scale: number): CSSProperties {
  return { maxWidth: STAND_SPACING * scale - 4 };
}

function markerCircle(item: MapItem, selected: boolean): ReactElement {
  const ring = selected ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : "";

  if (item.coverSrc) {
    return (
      <Image
        src={item.coverSrc}
        alt=""
        width={COVER_SIZE}
        height={COVER_SIZE}
        className={`size-13 rounded-full border-[3px] border-foreground object-cover ${ring}`}
      />
    );
  }

  if (item.gameName) {
    return (
      <span
        aria-hidden="true"
        className={`flex size-13 items-center justify-center rounded-full bg-accent font-mono text-sm text-background ${ring}`}
      >
        {gameInitials(item.gameName)}
      </span>
    );
  }

  return <span aria-hidden="true" className={`size-13 rounded-full border border-border bg-surface ${ring}`} />;
}

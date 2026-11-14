"use client";

import Image from "next/image";
import type { CSSProperties, ReactElement } from "react";
import { MapMarkerButton } from "@features/floor-plan/components/map-marker-button";
import { gameInitials } from "@features/floor-plan/lib/game-initials";
import { NAME_SCALE, isCompact, type MapPoint } from "@features/floor-plan/lib/map-viewport";
import type { MapItem } from "@features/floor-plan/lib/plan-items";

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
  if (selected) return selectedPin(item);

  return (
    <>
      {markerCircle(item)}
      <span className="relative mt-[-9px] border border-border bg-background px-1.5 py-px font-mono text-[10px] leading-[13px] text-paper">
        {item.code}
      </span>
      {scale >= NAME_SCALE && item.gameName ? (
        <span
          style={nameStyle(scale)}
          className="mt-1 truncate text-center font-mono text-[11px] leading-[13px] text-paper uppercase"
        >
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

function markerCircle(item: MapItem): ReactElement {
  if (item.coverSrc) {
    return (
      <span
        aria-hidden="true"
        className="flex size-13 items-center justify-center overflow-hidden rounded-full border-[3px] border-paper bg-accent shadow-[0_0_0_4px_rgba(0,0,0,0.65)] min-[1000px]:size-14"
      >
        <Image
          src={item.coverSrc}
          alt=""
          width={50}
          height={50}
          className="size-[46px] rounded-full object-cover min-[1000px]:size-[50px]"
        />
      </span>
    );
  }

  if (item.gameName) {
    return (
      <span
        aria-hidden="true"
        className="flex size-13 items-center justify-center rounded-full border-[3px] border-paper bg-accent font-wide text-sm font-bold text-background shadow-[0_0_0_4px_rgba(0,0,0,0.65)] min-[1000px]:size-14 min-[1000px]:text-[15px]"
      >
        {gameInitials(item.gameName)}
      </span>
    );
  }

  return (
    <span aria-hidden="true" className="size-13 rounded-full border border-border bg-surface min-[1000px]:size-14" />
  );
}

/** The selected stand: the accent teardrop pin of the mockup holding its cover or initials. */
function selectedPin(item: MapItem): ReactElement {
  return (
    <>
      <span
        data-selected="true"
        aria-hidden="true"
        className="flex size-[60px] -rotate-45 rounded-[50%_50%_50%_0] bg-accent p-[7px] shadow-[0_10px_28px_rgba(23,143,221,0.4)]"
      >
        {pinFace(item)}
      </span>
      <span className="mt-5 bg-accent px-1.5 py-px font-mono text-[10px] leading-[13px] text-background">
        {item.code}
      </span>
      {item.gameName ? (
        <span className="mt-1 text-center font-mono text-xs leading-[14px] text-paper uppercase">{item.gameName}</span>
      ) : null}
    </>
  );
}

function pinFace(item: MapItem): ReactElement {
  if (item.coverSrc) {
    return (
      <Image
        src={item.coverSrc}
        alt=""
        width={46}
        height={46}
        className="size-[46px] rotate-45 rounded-full object-cover"
      />
    );
  }

  if (item.gameName) {
    return (
      <span className="flex size-[46px] rotate-45 items-center justify-center rounded-full font-wide text-[15px] font-bold text-background">
        {gameInitials(item.gameName)}
      </span>
    );
  }

  return <span className="size-[46px] rotate-45 rounded-full bg-background" />;
}

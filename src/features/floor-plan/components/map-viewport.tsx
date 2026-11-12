"use client";

import { useEffect, type CSSProperties, type ReactElement } from "react";
import { MapControls } from "@features/floor-plan/components/map-controls";
import { MapDrawing } from "@features/floor-plan/components/map-drawing";
import { StandMarker } from "@features/floor-plan/components/stand-marker";
import { ZoneMarker } from "@features/floor-plan/components/zone-marker";
import { useMapViewport } from "@features/floor-plan/hooks/use-map-viewport";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { MAP_HEIGHT, MAP_WIDTH } from "@features/floor-plan/lib/map-layout";
import { isCompact, type MapPoint, type MapVariant, type MapView } from "@features/floor-plan/lib/map-viewport";
import type { MapItem } from "@features/floor-plan/lib/plan-items";

interface MapViewportProps {
  items: readonly MapItem[];
  selectedId: string | null;
  variant: MapVariant;
  focusSignal: { id: string; point: MapPoint } | null;
  onSelect: (id: string) => void;
}

/** The pannable map: the scaled drawing below, HTML markers in screen space above it. */
export function MapViewport({
  items,
  selectedId,
  variant,
  focusSignal,
  onSelect,
}: Readonly<MapViewportProps>): ReactElement {
  const { view, viewportRef, zoomIn, zoomOut, resetView, focusPoint } = useMapViewport({ variant });

  useEffect(() => {
    if (focusSignal) focusPoint(focusSignal.point);
  }, [focusSignal, focusPoint]);

  return (
    <div
      ref={viewportRef}
      data-scale={view.scale}
      className={`relative -ml-(--gutter) h-[clamp(360px,56svh,640px)] w-[calc(100%+var(--gutter)*2)] overflow-hidden bg-surface min-[1000px]:ml-0 min-[1000px]:aspect-940/600 min-[1000px]:h-auto min-[1000px]:max-h-[85svh] min-[1000px]:w-full min-[1000px]:border min-[1000px]:border-border ${variant === "page" ? "touch-none" : "touch-pan-y"}`}
    >
      <div aria-hidden="true" className="absolute inset-0" style={groundPatternStyle()} />
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="group"
        aria-label={FLOOR_PLAN_COPY.mapLabel}
        style={drawingStyle(view)}
        className="absolute top-0 left-0"
      >
        <MapDrawing />
      </svg>
      <MarkersLayer items={items} view={view} selectedId={selectedId} onSelect={onSelect} />
      {isCompact(view.scale) ? <CompactHint /> : null}
      <div className="absolute right-3 bottom-3">
        <MapControls onZoomIn={zoomIn} onZoomOut={zoomOut} onRecenter={resetView} />
      </div>
    </div>
  );
}

interface MarkersLayerProps {
  items: readonly MapItem[];
  view: MapView;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function MarkersLayer({ items, view, selectedId, onSelect }: Readonly<MarkersLayerProps>): ReactElement {
  const compact = isCompact(view.scale);

  return (
    <div className="absolute inset-0">
      {items.map((item) => (
        <MapMarker
          key={item.id}
          item={item}
          point={{ x: item.x * view.scale + view.x, y: item.y * view.scale + view.y }}
          selected={selectedId === item.id}
          scale={view.scale}
          compact={compact}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function CompactHint(): ReactElement {
  return (
    <p className="pointer-events-none absolute inset-x-0 top-3 text-center type-tiny text-foreground">
      <span className="bg-background px-3 py-1.5">{FLOOR_PLAN_COPY.compactHint}</span>
    </p>
  );
}

interface MapMarkerProps {
  item: MapItem;
  point: MapPoint;
  selected: boolean;
  scale: number;
  compact: boolean;
  onSelect: (id: string) => void;
}

function MapMarker({ item, point, selected, compact, scale, onSelect }: Readonly<MapMarkerProps>): ReactElement {
  if (item.kind === "stand") {
    return <StandMarker item={item} point={point} scale={scale} selected={selected} onSelect={onSelect} />;
  }

  return <ZoneMarker item={item} point={point} selected={selected} compact={compact} onSelect={onSelect} />;
}

function drawingStyle(view: MapView): CSSProperties {
  return {
    width: MAP_WIDTH * view.scale,
    height: MAP_HEIGHT * view.scale,
    transform: `translate(${view.x}px, ${view.y}px)`,
  };
}

/** Faint street lines over the map ground, reaching past the building like the mockups. */
function groundPatternStyle(): CSSProperties {
  const thin = "color-mix(in srgb, var(--border) 55%, transparent)";
  const avenue = "color-mix(in srgb, var(--border) 85%, transparent)";

  return {
    backgroundImage: [
      `repeating-linear-gradient(to right, transparent 0 86px, ${thin} 86px 87px)`,
      `repeating-linear-gradient(to bottom, transparent 0 86px, ${thin} 86px 87px)`,
      `repeating-linear-gradient(115deg, transparent 0 298px, ${avenue} 298px 312px)`,
    ].join(", "),
  };
}

"use client";

import { useEffect, useRef, type CSSProperties, type ReactElement, type RefObject } from "react";
import { MapControls } from "@features/floor-plan/components/map-controls";
import { MapDrawing } from "@features/floor-plan/components/map-drawing";
import { StandMarker } from "@features/floor-plan/components/stand-marker";
import { ZoneMarker } from "@features/floor-plan/components/zone-marker";
import { useMapViewport } from "@features/floor-plan/hooks/use-map-viewport";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { BLOCK_LABEL_SPOTS, EXTERIOR_LABEL_SPOT, MAP_HEIGHT, MAP_WIDTH } from "@features/floor-plan/lib/map-layout";
import { isCompact, type MapPoint, type MapVariant, type MapView } from "@features/floor-plan/lib/map-viewport";
import type { MapItem } from "@features/floor-plan/lib/plan-items";

/** A request to center a map point: hash links always apply, selections only when compact. */
export interface FocusSignal {
  id: string;
  point: MapPoint;
  always: boolean;
}

interface MapViewportProps {
  items: readonly MapItem[];
  selectedId: string | null;
  variant: MapVariant;
  focusSignal: FocusSignal | null;
  detailRef: RefObject<HTMLElement | null>;
  onSelect: (id: string) => void;
}

/** The pannable map: the scaled drawing below, HTML markers in screen space above it. */
export function MapViewport({
  items,
  selectedId,
  variant,
  focusSignal,
  detailRef,
  onSelect,
}: Readonly<MapViewportProps>): ReactElement {
  const { view, viewportRef, zoomIn, zoomOut, resetView, focusPoint } = useMapViewport({ variant, detailRef });
  const scaleRef = useRef(view.scale);

  useEffect(() => {
    scaleRef.current = view.scale;
  }, [view.scale]);

  useEffect(() => {
    if (focusSignal && (focusSignal.always || isCompact(scaleRef.current))) focusPoint(focusSignal.point);
  }, [focusSignal, focusPoint]);

  return (
    <div
      ref={viewportRef}
      data-scale={view.scale}
      className={`relative -ml-(--gutter) h-[clamp(360px,56svh,640px)] w-[calc(100%+var(--gutter)*2)] overflow-hidden bg-map-ground min-[1000px]:ml-0 min-[1000px]:aspect-940/600 min-[1000px]:h-auto min-[1000px]:max-h-[85svh] min-[1000px]:w-full min-[1000px]:border min-[1000px]:border-separator ${variant === "page" ? "touch-none" : "touch-pan-y"}`}
    >
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="group"
        aria-label={FLOOR_PLAN_COPY.mapLabel}
        style={drawingStyle(view)}
        className="absolute top-0 left-0"
      >
        <MapDrawing />
      </svg>
      <LabelsLayer view={view} />
      <MarkersLayer items={items} view={view} selectedId={selectedId} onSelect={onSelect} />
      {isCompact(view.scale) ? <CompactHint /> : null}
      <div className="absolute top-1/3 right-3 min-[1000px]:top-auto min-[1000px]:right-6 min-[1000px]:bottom-6">
        <MapControls onZoomIn={zoomIn} onZoomOut={zoomOut} onRecenter={resetView} />
      </div>
    </div>
  );
}

/** Block and exterior labels in fixed screen size, floating over the scaled drawing. */
function LabelsLayer({ view }: Readonly<{ view: MapView }>): ReactElement {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {BLOCK_LABEL_SPOTS.map(([zone, x, y]) => (
        <span key={zone} style={labelPosition(x, y, view)} className={blockLabelClass()}>
          {FLOOR_PLAN_COPY.drawing.blockLabels[zone]}
        </span>
      ))}
      <span style={labelPosition(EXTERIOR_LABEL_SPOT[0], EXTERIOR_LABEL_SPOT[1], view)} className={labelClass()}>
        {FLOOR_PLAN_COPY.drawing.exteriorLabel}
      </span>
    </div>
  );
}

function blockLabelClass(): string {
  // Lifts the label bottom 12 px above the marker circle top: 26 px radius + 12 px on
  // phones, 28 px radius + 12 px from 1000 px up, mirroring the marker sizes.
  return `${labelClass()} -translate-y-[calc(100%+38px)] min-[1000px]:-translate-y-[calc(100%+40px)]`;
}

function labelClass(): string {
  return "absolute font-mono text-[11px] font-medium tracking-[0.18em] text-muted uppercase";
}

function labelPosition(x: number, y: number, view: MapView): CSSProperties {
  return { left: x * view.scale + view.x, top: y * view.scale + view.y };
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

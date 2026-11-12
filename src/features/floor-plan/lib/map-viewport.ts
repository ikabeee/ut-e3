export interface MapSize {
  width: number;
  height: number;
}

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapView {
  scale: number;
  x: number;
  y: number;
}

export interface ViewLimits {
  minScale: number;
  maxScale: number;
  mapWidth: number;
  mapHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

export type MapVariant = "page" | "embedded";

export const COMPACT_SCALE = 0.75;

/** From this scale the stand markers show their game name next to the code badge. */
export const NAME_SCALE = 1.2;

export const MAX_SCALE = 2.5;

const FIT_MARGIN = 0.96;

/** Fits the whole map inside the viewport with a small margin, centered. */
export function fitView(mapSize: MapSize, viewportSize: MapSize): MapView {
  const scale = Math.min(viewportSize.width / mapSize.width, viewportSize.height / mapSize.height) * FIT_MARGIN;

  return {
    scale,
    x: (viewportSize.width - mapSize.width * scale) / 2,
    y: (viewportSize.height - mapSize.height * scale) / 2,
  };
}

export interface MapZoom {
  factor: number;
  point: MapPoint;
}

/** Zooms by the factor keeping the viewport point fixed over the same map point, clamped to the limits. */
export function zoomAt(view: MapView, zoom: MapZoom, limits: ViewLimits): MapView {
  const scale = clampScale(view.scale * zoom.factor, limits);
  const ratio = scale / view.scale;

  return clampPan(
    { scale, x: zoom.point.x - (zoom.point.x - view.x) * ratio, y: zoom.point.y - (zoom.point.y - view.y) * ratio },
    limits,
  );
}

/** Moves the map by the delta, clamped so the map cannot leave the viewport entirely. */
export function panBy(view: MapView, delta: MapPoint, limits: ViewLimits): MapView {
  return clampPan({ scale: view.scale, x: view.x + delta.x, y: view.y + delta.y }, limits);
}

/** Centers a map point in the viewport without changing the scale. */
export function centerOn(view: MapView, mapPoint: MapPoint, limits: ViewLimits): MapView {
  return clampPan(
    {
      scale: view.scale,
      x: limits.viewportWidth / 2 - mapPoint.x * view.scale,
      y: limits.viewportHeight / 2 - mapPoint.y * view.scale,
    },
    limits,
  );
}

/** From this viewport width the detail is a side card that leaves the markers centered. */
export const SHEET_BREAKPOINT = 1000;

/**
 * Limits for centering a focused point: below the breakpoint the detail is a
 * bottom sheet, so the uncovered area above it becomes the centering space.
 */
export function focusLimits(limits: ViewLimits, viewportWidth: number, sheetHeight: number): ViewLimits {
  if (viewportWidth >= SHEET_BREAKPOINT || sheetHeight <= 0) return limits;

  return { ...limits, viewportHeight: Math.max(1, limits.viewportHeight - sheetHeight) };
}

/** Below this scale the markers turn into dots and the map shows its zoom hint. */
export function isCompact(scale: number): boolean {
  return scale < COMPACT_SCALE;
}

function clampScale(scale: number, limits: ViewLimits): number {
  return Math.min(limits.maxScale, Math.max(limits.minScale, scale));
}

function clampPan(view: MapView, limits: ViewLimits): MapView {
  return {
    scale: view.scale,
    x: clampAxis(view.x, limits.viewportWidth, limits.mapWidth * view.scale),
    y: clampAxis(view.y, limits.viewportHeight, limits.mapHeight * view.scale),
  };
}

function clampAxis(offset: number, viewportLength: number, mapLength: number): number {
  return Math.min(viewportLength - 1, Math.max(1 - mapLength, offset));
}

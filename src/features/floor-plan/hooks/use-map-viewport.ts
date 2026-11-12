"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { MAP_HEIGHT, MAP_WIDTH } from "@features/floor-plan/lib/map-layout";
import {
  MAX_SCALE,
  centerOn,
  fitView,
  panBy,
  zoomAt,
  type MapPoint,
  type MapSize,
  type MapVariant,
  type MapView,
  type ViewLimits,
} from "@features/floor-plan/lib/map-viewport";

const MAP_SIZE: MapSize = { width: MAP_WIDTH, height: MAP_HEIGHT };

const ZOOM_STEP = 1.5;

const DRAG_THRESHOLD = 6;

const WHEEL_ZOOM_SPEED = 0.0015;

interface UseMapViewportOptions {
  variant: MapVariant;
}

interface MapViewportApi {
  view: MapView;
  viewportRef: RefObject<HTMLDivElement | null>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  focusPoint: (point: MapPoint) => void;
}

/** Owns the pan and zoom of the map: the component only renders the view it returns. */
export function useMapViewport({ variant }: UseMapViewportOptions): MapViewportApi {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState<MapSize>(MAP_SIZE);
  const [view, setView] = useState<MapView>(() => fitView(MAP_SIZE, MAP_SIZE));

  useViewportSize(viewportRef, setViewportSize, setView);
  useViewportGestures(viewportRef, { variant, size: viewportSize, setView });

  const zoomIn = useCallback(
    () =>
      setView((current) =>
        zoomAt(current, { factor: ZOOM_STEP, point: centerOf(viewportSize) }, viewLimits(viewportSize)),
      ),
    [viewportSize],
  );

  const zoomOut = useCallback(
    () =>
      setView((current) =>
        zoomAt(current, { factor: 1 / ZOOM_STEP, point: centerOf(viewportSize) }, viewLimits(viewportSize)),
      ),
    [viewportSize],
  );

  const resetView = useCallback(() => setView(fitView(MAP_SIZE, viewportSize)), [viewportSize]);

  const focusPoint = useCallback(
    (point: MapPoint) => setView((current) => focusOnPoint(current, point, viewportSize)),
    [viewportSize],
  );

  return { view, viewportRef, zoomIn, zoomOut, resetView, focusPoint };
}

function centerOf(size: MapSize): MapPoint {
  return { x: size.width / 2, y: size.height / 2 };
}

function viewLimits(size: MapSize): ViewLimits {
  return {
    minScale: fitView(MAP_SIZE, size).scale / 2,
    maxScale: MAX_SCALE,
    mapWidth: MAP_WIDTH,
    mapHeight: MAP_HEIGHT,
    viewportWidth: size.width,
    viewportHeight: size.height,
  };
}

function focusOnPoint(view: MapView, point: MapPoint, viewportSize: MapSize): MapView {
  const limits = viewLimits(viewportSize);
  const zoomed = zoomToFullScale(view, viewportSize, limits);

  return centerOn(zoomed, point, limits);
}

function zoomToFullScale(view: MapView, viewportSize: MapSize, limits: ViewLimits): MapView {
  if (view.scale >= 1) return view;

  return zoomAt(view, { factor: 1 / view.scale, point: centerOf(viewportSize) }, limits);
}

function useViewportSize(
  ref: RefObject<HTMLDivElement | null>,
  setSize: Dispatch<SetStateAction<MapSize>>,
  setView: Dispatch<SetStateAction<MapView>>,
): void {
  useEffect(() => {
    const element = ref.current;

    if (!element) return undefined;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        if (width > 0 && height > 0) {
          const next = { width, height };

          setSize(next);
          setView(fitView(MAP_SIZE, next));
        }
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, setSize, setView]);
}

interface GestureOptions {
  variant: MapVariant;
  size: MapSize;
  setView: Dispatch<SetStateAction<MapView>>;
}

function useViewportGestures(ref: RefObject<HTMLDivElement | null>, options: GestureOptions): void {
  const { variant, size, setView } = options;

  useEffect(() => {
    const element = ref.current;

    if (!element) return undefined;

    const context: GestureContext = { element, variant, size, setView, state: createGestureState() };
    const onDown = (event: PointerEvent) => handlePointerDown(context, event);
    const onMove = (event: PointerEvent) => handlePointerMove(context, event);
    const onUp = (event: PointerEvent) => handlePointerUp(context, event);
    const onClick = (event: MouseEvent) => handleClickCapture(context, event);
    const onWheel = (event: WheelEvent) => handleWheel(context, event);

    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);
    element.addEventListener("click", onClick, true);
    element.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
      element.removeEventListener("click", onClick, true);
      element.removeEventListener("wheel", onWheel);
    };
  }, [ref, variant, size, setView]);
}

interface TrackedPointer {
  point: MapPoint;
  origin: MapPoint;
  pointerType: string;
}

interface GestureState {
  pointers: Map<number, TrackedPointer>;
  lastPinch: { distance: number; mid: MapPoint } | null;
  dragged: boolean;
  suppressClick: boolean;
  capturedId: number | null;
}

interface GestureContext {
  element: HTMLDivElement;
  variant: MapVariant;
  size: MapSize;
  setView: Dispatch<SetStateAction<MapView>>;
  state: GestureState;
}

function createGestureState(): GestureState {
  return { pointers: new Map(), lastPinch: null, dragged: false, suppressClick: false, capturedId: null };
}

function handlePointerDown(context: GestureContext, event: PointerEvent): void {
  const point = toLocal(event, context.element);

  context.state.pointers.set(event.pointerId, { point, origin: point, pointerType: event.pointerType });

  if (context.state.pointers.size > 1) context.state.lastPinch = readPinch(context.state);
}

function handlePointerMove(context: GestureContext, event: PointerEvent): void {
  const tracked = context.state.pointers.get(event.pointerId);

  if (!tracked) return;

  const next = toLocal(event, context.element);

  context.state.pointers.set(event.pointerId, { ...tracked, point: next });

  if (context.state.pointers.size > 1) {
    applyPinch(context);

    return;
  }

  if (context.variant === "embedded" && tracked.pointerType === "touch") return;

  applyDrag(context, tracked, { to: next, pointerId: event.pointerId });
}

function handlePointerUp(context: GestureContext, event: PointerEvent): void {
  context.state.pointers.delete(event.pointerId);
  releaseCapture(context, event.pointerId);

  if (context.state.pointers.size < 2) context.state.lastPinch = null;

  if (context.state.pointers.size === 0 && context.state.dragged) {
    context.state.dragged = false;
    context.state.suppressClick = true;
  }
}

function handleClickCapture(context: GestureContext, event: MouseEvent): void {
  if (!context.state.suppressClick) return;

  context.state.suppressClick = false;
  event.stopPropagation();
  event.preventDefault();
}

function handleWheel(context: GestureContext, event: WheelEvent): void {
  if (context.variant === "embedded" && !event.ctrlKey && !event.metaKey) return;

  event.preventDefault();

  const factor = Math.exp(-event.deltaY * WHEEL_ZOOM_SPEED);

  context.setView((view) => zoomAt(view, { factor, point: toLocal(event, context.element) }, viewLimits(context.size)));
}

interface DragMove {
  to: MapPoint;
  pointerId: number;
}

function applyDrag(context: GestureContext, tracked: TrackedPointer, move: DragMove): void {
  if (!context.state.dragged && distance(move.to, tracked.origin) < DRAG_THRESHOLD) return;

  if (!context.state.dragged) startCapture(context, move.pointerId);

  context.state.dragged = true;
  context.setView((view) =>
    panBy(view, { x: move.to.x - tracked.point.x, y: move.to.y - tracked.point.y }, viewLimits(context.size)),
  );
}

/** Keeps the drag going outside the viewport; marker clicks never reach here, so they still work. */
function startCapture(context: GestureContext, pointerId: number): void {
  try {
    context.element.setPointerCapture(pointerId);
    context.state.capturedId = pointerId;
  } catch {
    // Synthetic pointers and some browsers refuse capture; the drag still works inside the viewport.
  }
}

function releaseCapture(context: GestureContext, pointerId: number): void {
  if (context.state.capturedId !== pointerId) return;

  context.state.capturedId = null;

  try {
    context.element.releasePointerCapture(pointerId);
  } catch {
    // The pointer is already gone; capture releases on its own.
  }
}

function applyPinch(context: GestureContext): void {
  const pinch = readPinch(context.state);
  const last = context.state.lastPinch;

  context.state.lastPinch = pinch;

  if (!pinch || !last || last.distance === 0) return;

  const factor = pinch.distance / last.distance;

  context.setView((view) =>
    panBy(
      zoomAt(view, { factor, point: pinch.mid }, viewLimits(context.size)),
      { x: pinch.mid.x - last.mid.x, y: pinch.mid.y - last.mid.y },
      viewLimits(context.size),
    ),
  );
}

function readPinch(state: GestureState): { distance: number; mid: MapPoint } | null {
  const [first, second] = [...state.pointers.values()].map((pointer) => pointer.point);

  if (!first || !second) return null;

  return {
    distance: Math.hypot(second.x - first.x, second.y - first.y),
    mid: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
  };
}

function toLocal(event: { clientX: number; clientY: number }, element: HTMLDivElement): MapPoint {
  const rect = element.getBoundingClientRect();

  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function distance(first: MapPoint, second: MapPoint): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

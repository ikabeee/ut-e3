import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import type { PlanViewport } from "@features/floor-plan/hooks/use-plan-viewport";
import { getViewBoxCenter, type Point } from "@features/floor-plan/lib/plan-viewport";

/** Píxeles que hay que mover el puntero para que cuente como arrastre y no como clic. */
const DRAG_THRESHOLD = 4;
/** Sensibilidad de la rueda del mouse. */
const WHEEL_ZOOM_SPEED = 0.0018;
/** Fracción de la vista que avanzan las flechas del teclado. */
const KEYBOARD_PAN = 0.08;

interface Pinch {
  distance: number;
  midpoint: Point;
}

/**
 * Arrastrar para mover, rueda o pellizco para acercar y teclado (flechas, + y −) sobre el
 * SVG del croquis. `consumeDrag()` indica si el último clic fue en realidad un arrastre.
 */
export function usePlanGestures(svgRef: RefObject<SVGSVGElement | null>, viewport: PlanViewport) {
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<Pinch | null>(null);
  const dragged = useRef(false);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const { viewBoxRef, zoomAt, zoomStep, pan, stopAnimation } = viewport;

  /** Convierte coordenadas de pantalla a coordenadas del croquis. */
  const toPlanPoint = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = svgRef.current?.getBoundingClientRect();
      const view = viewBoxRef.current;
      if (!rect || rect.width === 0) {
        return getViewBoxCenter(view);
      }
      return {
        x: view.x + ((clientX - rect.left) * view.width) / rect.width,
        y: view.y + ((clientY - rect.top) * view.height) / rect.height,
      };
    },
    [svgRef, viewBoxRef],
  );

  const pixelsToPlan = useCallback(() => {
    const width = svgRef.current?.getBoundingClientRect().width ?? 0;
    return width === 0 ? 0 : viewBoxRef.current.width / width;
  }, [svgRef, viewBoxRef]);

  // La rueda necesita un listener no pasivo para evitar que la página haga scroll.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(Math.exp(-event.deltaY * WHEEL_ZOOM_SPEED), toPlanPoint(event.clientX, event.clientY));
    };
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [svgRef, toPlanPoint, zoomAt]);

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragged.current = false;
    stopAnimation();
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        midpoint: toPlanPoint((a.x + b.x) / 2, (a.y + b.y) / 2),
      };
    }
  };

  /** Mueve la vista; devuelve `false` si el puntero no está presionado (sólo es hover). */
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) {
      return false;
    }
    const current = { x: event.clientX, y: event.clientY };

    if (pointers.current.size === 1) {
      if (!dragged.current && Math.hypot(current.x - previous.x, current.y - previous.y) < DRAG_THRESHOLD) {
        return true;
      }
      if (!dragged.current) {
        dragged.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsGrabbing(true);
      }
      const scale = pixelsToPlan();
      pan(-(current.x - previous.x) * scale, -(current.y - previous.y) * scale);
      pointers.current.set(event.pointerId, current);
      return true;
    }

    pointers.current.set(event.pointerId, current);
    if (pinch.current) {
      dragged.current = true;
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(distance / pinch.current.distance, pinch.current.midpoint);
      pinch.current = { distance, midpoint: toPlanPoint((a.x + b.x) / 2, (a.y + b.y) / 2) };
    }
    return true;
  };

  const onPointerEnd = (event: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) {
      pinch.current = null;
    }
    if (pointers.current.size === 0) {
      setIsGrabbing(false);
    }
  };

  /** Teclado sobre el croquis (no sobre un stand): flechas para mover, + y − para el zoom. */
  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = viewBoxRef.current.width * KEYBOARD_PAN;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move && event.target === event.currentTarget) {
      event.preventDefault();
      pan(move[0], move[1]);
    } else if (event.key === "+" || event.key === "=") {
      zoomStep(1);
    } else if (event.key === "-") {
      zoomStep(-1);
    }
  };

  const consumeDrag = useCallback(() => {
    const wasDragged = dragged.current;
    dragged.current = false;
    return wasDragged;
  }, []);

  return {
    isGrabbing,
    consumeDrag,
    handlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd, onKeyDown },
  };
}

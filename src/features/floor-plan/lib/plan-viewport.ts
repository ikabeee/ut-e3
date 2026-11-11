import type { PlanRect, ViewBox } from "@features/floor-plan/lib/types";

/** Acercamiento máximo: la vista puede ser hasta 6 veces más chica que el croquis. */
const MAX_ZOOM = 6;
/** Fracción de la vista que puede salir del croquis al arrastrar. */
const OVERSCROLL = 0.25;

export interface Point {
  x: number;
  y: number;
}

/**
 * Ajusta una vista a los límites: conserva la proporción del croquis, limita el zoom y
 * no deja que se pierda de vista. Al alejarse por completo vuelve al encuadre inicial.
 */
export function clampViewBox(view: ViewBox, base: ViewBox): ViewBox {
  const minWidth = base.width / MAX_ZOOM;
  const width = Math.min(base.width, Math.max(minWidth, view.width));
  const height = (width * base.height) / base.width;
  if (width >= base.width) {
    return { ...base };
  }

  const resized = width !== view.width;
  let x = resized ? view.x + (view.width - width) / 2 : view.x;
  let y = resized ? view.y + (view.height - height) / 2 : view.y;
  x = Math.min(Math.max(x, base.x - width * OVERSCROLL), base.x + base.width - width * (1 - OVERSCROLL));
  y = Math.min(Math.max(y, base.y - height * OVERSCROLL), base.y + base.height - height * (1 - OVERSCROLL));
  return { x, y, width, height };
}

/** Acerca (`factor > 1`) o aleja la vista manteniendo fijo `point`. */
export function zoomViewBox(view: ViewBox, factor: number, point: Point, base: ViewBox): ViewBox {
  return clampViewBox(
    {
      x: point.x - (point.x - view.x) / factor,
      y: point.y - (point.y - view.y) / factor,
      width: view.width / factor,
      height: view.height / factor,
    },
    base,
  );
}

export function getViewBoxCenter(view: ViewBox): Point {
  return { x: view.x + view.width / 2, y: view.y + view.height / 2 };
}

export function panViewBox(view: ViewBox, deltaX: number, deltaY: number, base: ViewBox): ViewBox {
  return clampViewBox({ ...view, x: view.x + deltaX, y: view.y + deltaY }, base);
}

/** Vista centrada en un stand o zona, con margen alrededor. */
export function focusViewBox([x, y, width, height]: PlanRect, base: ViewBox): ViewBox {
  const aspect = base.height / base.width;
  const candidateWidth = Math.max(width * 4.5, base.width / 2);
  const viewHeight = Math.max(candidateWidth * aspect, height * 2.4);
  const viewWidth = viewHeight / aspect;
  return clampViewBox(
    { x: x + width / 2 - viewWidth / 2, y: y + height / 2 - viewHeight / 2, width: viewWidth, height: viewHeight },
    base,
  );
}

/** Porcentaje de zoom que muestran los controles (100% = croquis completo). */
export function getZoomPercent(view: ViewBox, base: ViewBox) {
  return Math.round((base.width / view.width) * 100);
}

export function interpolateViewBox(from: ViewBox, to: ViewBox, progress: number): ViewBox {
  const mix = (a: number, b: number) => a + (b - a) * progress;
  return {
    x: mix(from.x, to.x),
    y: mix(from.y, to.y),
    width: mix(from.width, to.width),
    height: mix(from.height, to.height),
  };
}

export function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

export function toViewBoxAttribute(view: ViewBox) {
  return `${view.x} ${view.y} ${view.width} ${view.height}`;
}

import { getStandCells } from "@features/floor-plan/lib/plan-layouts";
import type { PlanLayout, PlanRect } from "@features/floor-plan/lib/types";

/**
 * Lo más que crece cada lado del área táctil, en unidades del SVG. Con 10, todo mide 44 px o más
 * donde el croquis es más chico: el vertical en pantallas de 360 px (Comida, Descanso, Info y WC
 * eran las más bajas) y el horizontal a 560 px, donde empieza a usarse (la entrada).
 */
export const TOUCH_MARGIN = 10;

interface Edges {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function toEdges([x, y, width, height]: PlanRect): Edges {
  return { left: x, top: y, right: x + width, bottom: y + height };
}

type Interval = readonly [number, number];

/** `true` si los intervalos se tocan después de agrandar cada uno `margin` hacia ambos lados. */
function overlapsWithin([startA, endA]: Interval, [startB, endB]: Interval, margin: number) {
  return startA - margin < endB + margin && startB - margin < endA + margin;
}

/**
 * Agranda un intervalo hasta `margin` por lado, sin salir de `limits` ni pasar de la mitad del
 * espacio que lo separa de cada bloqueo.
 */
function growInterval([start, end]: Interval, blockers: readonly Interval[], limits: Interval, margin: number): Interval {
  let low = Math.max(limits[0], start - margin);
  let high = Math.min(limits[1], end + margin);
  for (const [blockerStart, blockerEnd] of blockers) {
    if (blockerStart >= end) high = Math.min(high, (end + blockerStart) / 2);
    if (blockerEnd <= start) low = Math.max(low, (blockerEnd + start) / 2);
  }
  return [low, high];
}

/**
 * Agranda `rect` hasta `margin` por lado sin pasar de la mitad del espacio que lo separa de cada
 * vecino ni salir de `bounds`. Como el vecino tampoco pasa de esa mitad, dos áreas nunca se
 * solapan. Un vecino cuenta en un eje si sus proyecciones en el otro eje quedan a menos de
 * `2 * margin`: así tampoco se solapan las esquinas de vecinos en diagonal.
 */
export function expandWithinNeighbors(
  rect: PlanRect,
  neighbors: readonly PlanRect[],
  bounds: PlanRect,
  margin: number = TOUCH_MARGIN,
): PlanRect {
  const own = toEdges(rect);
  const limits = toEdges(bounds);
  const others = neighbors.map(toEdges);
  const ownX: Interval = [own.left, own.right];
  const ownY: Interval = [own.top, own.bottom];

  const [left, right] = growInterval(
    ownX,
    others.filter((other) => overlapsWithin(ownY, [other.top, other.bottom], margin)).map((other) => [other.left, other.right]),
    [limits.left, limits.right],
    margin,
  );
  const [top, bottom] = growInterval(
    ownY,
    others.filter((other) => overlapsWithin(ownX, [other.left, other.right], margin)).map((other) => [other.top, other.bottom]),
    [limits.top, limits.bottom],
    margin,
  );

  return [left, top, right - left, bottom - top];
}

/**
 * Área táctil de cada stand y zona del croquis (id -> rectángulo). En el teléfono el croquis se
 * achica y algunas zonas quedan por debajo de 44 px; esta área invisible amplía el toque hacia
 * el espacio libre de alrededor sin invadir a los vecinos. El área de público no se puede tocar,
 * pero cuenta como vecino para que tocarla no elija el escenario.
 */
export function getTouchRects(layout: PlanLayout): ReadonlyMap<string, PlanRect> {
  const targets: [string, PlanRect][] = [
    ...Object.entries(layout.zones).map(([id, zone]): [string, PlanRect] => [id, zone.rect]),
    ["entry", layout.entry],
    ...layout.standBlocks.flatMap((block) => getStandCells(block).map(({ code, rect }): [string, PlanRect] => [code, rect])),
  ];
  const obstacles = [...targets.map(([, rect]) => rect), layout.publicArea];
  const bounds: PlanRect = [0, 0, layout.width, layout.height];

  return new Map(
    targets.map(([id, rect]) => [
      id,
      expandWithinNeighbors(
        rect,
        obstacles.filter((obstacle) => obstacle !== rect),
        bounds,
      ),
    ]),
  );
}

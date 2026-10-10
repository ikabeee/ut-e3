import type { CSSProperties } from "react";

/**
 * Geometría del exhibidor 3D (`layoutFan` del diseño) expresada en CSS: el tamaño de las
 * cajas sale del ancho del contenedor (`cqw`), así el HTML del servidor ya tiene el layout
 * correcto en cualquier pantalla y no hay saltos al hidratar.
 *
 * Variables que define el contenedor `.fan` (ver `game-coverflow.tsx`):
 * `--cw` ancho de caja, `--gap-f` separación de la primera caja, `--step-f` separación entre
 * las demás, `--depth-f` profundidad y `--angle` giro (cambian por debajo de 640 px).
 */
export interface CoverflowCasePlacement {
  style: CSSProperties;
  isCurrent: boolean;
}

/**
 * Posición de cada caja respecto a la actual: al frente o desplazada hacia un lado, hundida
 * y girada hacia el centro. Las medidas salen de las variables CSS del contenedor.
 */
export function getCoverflowPlacement(index: number, current: number): CoverflowCasePlacement {
  const offset = index - current;
  const distance = Math.abs(offset);
  const side = Math.sign(offset);
  const transform =
    offset === 0
      ? "translate3d(0px, 0, 0px) rotateY(0deg)"
      : `translate3d(calc(${side} * (var(--cw) * var(--gap-f) + ${distance - 1} * var(--cw) * var(--step-f))), 0, calc(var(--cw) * var(--depth-f) * -1)) rotateY(calc(var(--angle) * ${-side}))`;

  return {
    isCurrent: offset === 0,
    style: { transform, zIndex: 100 - distance },
  };
}

/** Caja que se muestra al frente al cargar: la del centro del catálogo. */
export function getInitialCoverflowIndex(count: number) {
  return Math.floor((count - 1) / 2);
}

/** Texto del contador para lectores de pantalla: "09 de 18". */
export function describeCoverflowPosition(current: number, count: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(current + 1)} de ${pad(count)}`;
}

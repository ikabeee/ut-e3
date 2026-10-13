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

/** La caja del frente: sin desplazamiento ni giro. */
const FRONT_TRANSFORM = "translate3d(0px, 0, 0px) rotateY(0deg)";

/**
 * Caja de lado (`offset` distinto de 0): la primera se separa `--gap-f` anchos de caja y cada una
 * de las siguientes `--step-f` más; todas se hunden `--depth-f` y giran `--angle` hacia el centro.
 */
function getSideTransform(offset: number) {
  const side = Math.sign(offset);
  const casesAfterFirst = Math.abs(offset) - 1;

  const shiftX = `calc(${side} * (var(--cw) * var(--gap-f) + ${casesAfterFirst} * var(--cw) * var(--step-f)))`;
  const depthZ = "calc(var(--cw) * var(--depth-f) * -1)";
  const turn = `calc(var(--angle) * ${-side})`;

  return `translate3d(${shiftX}, 0, ${depthZ}) rotateY(${turn})`;
}

/**
 * Posición de cada caja respecto a la actual: al frente o desplazada hacia un lado, hundida
 * y girada hacia el centro. Las medidas salen de las variables CSS del contenedor.
 */
export function getCoverflowPlacement(index: number, current: number): CoverflowCasePlacement {
  const offset = index - current;
  const isCurrent = offset === 0;
  const transform = isCurrent ? FRONT_TRANSFORM : getSideTransform(offset);

  return {
    isCurrent,
    style: { transform, zIndex: 100 - Math.abs(offset) },
  };
}

/** Caja que se muestra al frente al cargar: la del centro del catálogo. */
export function getInitialCoverflowIndex(count: number) {
  return Math.floor((count - 1) / 2);
}

import type { ReactNode } from "react";

/**
 * Categorías del croquis (también son los filtros y la leyenda):
 * `team` stand de equipo, `info` stand informativo, `act` escenario y actividades, `srv` servicios.
 */
export type PlanCategory = "team" | "info" | "act" | "srv";

export type ZoneId = "stage" | "arena" | "raffles" | "food" | "info" | "wc" | "rest" | "entry";

/** Zona del recinto (escenario, arena, servicios, entrada...). */
export interface PlanZone {
  category: "act" | "srv";
  /** Tipo que se muestra como antetítulo, por ejemplo "Servicios". */
  kind: string;
  title: string;
  description: string;
}

/**
 * Horarios del programa que mencionan las zonas del croquis. El croquis no conoce el programa:
 * la page los pasa desde `event` (`getEventContent().highlights` tiene esta forma).
 */
export interface PlanZoneTimes {
  tournamentSignupDeadline: string;
  raffleTimes: readonly string[];
}

/** Stand que no es de un equipo (división, patrocinadores...). */
export interface InfoStand {
  title: string;
  description: string;
}

/**
 * Lo que el croquis necesita saber de quien ocupa un stand de equipo. El croquis no conoce los
 * juegos: cada dominio que ocupa stands (hoy `games`) se convierte a este tipo en su feature.
 */
export interface StandOccupant {
  /** Código del stand, por ejemplo "A1". */
  stand: string;
  title: string;
  /** Antetítulo del panel, por ejemplo el género del juego. */
  subtitle: string;
  description: string;
  /** Portada del panel (imagen o arte). La pinta quien conoce al ocupante; `null` si no tiene. */
  cover: ReactNode;
}

/** Cualquier punto seleccionable del croquis, listo para el panel y el directorio. */
export interface PlanItem {
  /** Código del stand ("A1") o id de la zona ("stage"). */
  id: string;
  category: PlanCategory;
  /** Código visible del stand; vacío en las zonas. */
  code: string;
  title: string;
  /** Género del juego, "Informativo" o el tipo de zona. */
  subtitle: string;
  description: string;
  /** Portada del ocupante (sólo en stands de equipo). */
  cover: ReactNode;
}

export type PlanOrientation = "wide" | "tall";

/** Rectángulo `[x, y, ancho, alto]` en coordenadas del SVG. */
export type PlanRect = readonly [number, number, number, number];

export interface ZoneShape {
  rect: PlanRect;
  label: string;
  /** Tamaño de la etiqueta; 18 si se omite. */
  fontSize?: number;
}

/** Bloque de stands en cuadrícula (pasillos A, B y central). */
export interface StandBlock {
  /** Prefijo del código: los stands se numeran A1, A2... por filas. */
  prefix: string;
  name: string;
  origin: readonly [number, number];
  step: readonly [number, number];
  size: readonly [number, number];
  columns: number;
  rows: number;
  /** Posición de la etiqueta del pasillo. */
  labelAt: readonly [number, number];
}

/** Geometría completa de una orientación del croquis. */
export interface PlanLayout {
  width: number;
  height: number;
  /** Trazo del muro perimetral (con el hueco de la entrada). */
  wall: string;
  /** Límites de la retícula de puntos: `[x0, x1, y0, y1]`. */
  dots: readonly [number, number, number, number];
  zones: Partial<Record<Exclude<ZoneId, "entry">, ZoneShape>>;
  publicArea: PlanRect;
  entry: PlanRect;
  /** Posición del texto "ENTRADA" en el croquis del inicio; `null` lo pone bajo la entrada. */
  entryLabelAt: readonly [number, number] | null;
  standBlocks: readonly StandBlock[];
  /** Tamaño del nombre dentro de cada stand. */
  standNameSize: number;
}

/** Stand ya posicionado en el croquis. */
export interface StandCell {
  code: string;
  rect: PlanRect;
}

/** Área visible del SVG (atributo `viewBox`). */
export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Posición del puntero relativa al contenedor del croquis (para el tooltip). */
export interface TooltipAnchor {
  x: number;
  y: number;
  containerWidth: number;
  containerHeight: number;
}

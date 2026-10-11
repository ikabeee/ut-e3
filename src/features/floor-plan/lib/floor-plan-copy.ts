import type { PlanCategory, PlanZoneTimes, ZoneId } from "@features/floor-plan/lib/types";
import { formatList } from "@shared/lib/text";

/** Nombre de cada categoría en la leyenda, el directorio y el tooltip. */
export const PLAN_CATEGORY_LABELS: Record<PlanCategory, string> = {
  team: "Stand de equipo",
  info: "Stand informativo",
  act: "Escenario y actividades",
  srv: "Servicios",
};

/** Etiquetas en plural de los filtros del croquis. */
export const PLAN_FILTER_LABELS: Record<PlanCategory, string> = {
  team: "Stands de equipo",
  info: "Stands informativos",
  act: "Escenario y actividades",
  srv: "Servicios",
};

/**
 * Frases de las zonas que citan un horario del programa. El horario no se escribe aquí: la page
 * lo pasa desde `event` (`PlanZoneTimes`) y `buildPlanItems` agrega la frase a la descripción.
 */
export const PLAN_ZONE_SCHEDULE_NOTES: Partial<Record<ZoneId, (times: PlanZoneTimes) => string>> = {
  arena: ({ tournamentSignupDeadline }) => `Inscríbete aquí antes de las ${tournamentSignupDeadline}.`,
  raffles: ({ raffleTimes }) => `Los sorteos se hacen en el main stage a las ${formatList(raffleTimes)}.`,
};

/** Textos de la interfaz del croquis. */
export const FLOOR_PLAN_COPY = {
  explorer: {
    heading: "Croquis",
    description:
      "Ubica los stands de cada equipo, el main stage, la arena de torneos y los servicios del evento. Toca cualquier punto del mapa para ver su información.",
    mapLabel: "Croquis interactivo. Arrastra para mover, usa la rueda o pellizca para acercar.",
    filtersLabel: "Mostrar en el mapa",
  },
  overview: {
    mapLabel: "Croquis del evento con zonas y stands",
  },
  zoom: {
    toolbarLabel: "Controles del mapa",
    zoomOut: "Alejar",
    zoomIn: "Acercar",
    fit: "Ajustar a la pantalla",
  },
  drawing: {
    publicArea: "Público",
    entry: "Entrada",
    /** Nombre accesible de un stand: "Stand A1, Ceniza Protocol" o sólo "Stand C4". */
    standLabel: (code: string, title?: string) => (title ? `Stand ${code}, ${title}` : `Stand ${code}`),
  },
  /** Antetítulo del panel de un stand: "Stand A1 · Acción". */
  standKicker: (code: string, subtitle: string) => `Stand ${code} · ${subtitle}`,
  infoStandSubtitle: "Informativo",
} as const;

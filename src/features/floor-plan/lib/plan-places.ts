import type { InfoStand, PlanCategory, PlanZone, ZoneId } from "@features/floor-plan/lib/types";

/**
 * Zonas del recinto. Es contenido editable: cambia aquí títulos y descripciones.
 * La posición de cada zona está en `plan-layouts.ts`.
 */
export const PLAN_ZONES: Record<ZoneId, PlanZone> = {
  stage: {
    category: "act",
    kind: "Escenario",
    title: "Main Stage",
    description: "Presentación de los equipos, sorteos, finales de los torneos y premiación.",
  },
  arena: {
    category: "act",
    kind: "Actividades",
    title: "Arena de torneos",
    description: "Estaciones para las rondas de los torneos. Inscríbete aquí antes de las 12:00.",
  },
  sorteos: {
    category: "act",
    kind: "Actividades",
    title: "Premios",
    description: "Exhibición de los premios. Los sorteos se hacen en el main stage a las 13:00, 16:00 y 19:00.",
  },
  food: {
    category: "srv",
    kind: "Servicios",
    title: "Comida",
    description: "Puestos de comida y bebidas con mesas para descansar.",
  },
  info: {
    category: "srv",
    kind: "Servicios",
    title: "Información",
    description: "Boletos para los sorteos, objetos perdidos y primeros auxilios.",
  },
  wc: { category: "srv", kind: "Servicios", title: "Baños", description: "Baños generales y accesibles." },
  rest: { category: "srv", kind: "Servicios", title: "Descanso", description: "Zona con sombra y asientos." },
  entry: { category: "act", kind: "Acceso", title: "Entrada", description: "Acceso libre, sin registro ni boleto." },
};

/** Stands informativos (pasillo central). Los stands de equipo salen del juego asignado. */
export const INFO_STANDS: Record<string, InfoStand> = {
  C1: {
    title: "Ingeniería y Tecnologías",
    description:
      "Stand de la División de Ingeniería y Tecnologías. Conoce las carreras y los proyectos de la división.",
  },
  C2: { title: "Inscripción a torneos", description: "Consulta las bases y los horarios de cada torneo." },
  C3: {
    title: "Oferta educativa",
    description: "Información sobre las carreras y el proceso de admisión de la UT Cancún.",
  },
  C4: {
    title: "Patrocinadores",
    description: "Stand de las marcas que apoyan el evento y los premios de los sorteos.",
  },
};

/** Orden de las categorías en filtros, leyenda y directorio. */
export const PLAN_CATEGORIES: readonly PlanCategory[] = ["team", "info", "act", "srv"];

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

import type { InfoStand, PlanCategory, PlanZone, ZoneId } from "@features/floor-plan/lib/types";
import { siteConfig } from "@shared/lib/site-config";

const { division, universityShortName } = siteConfig.organization;

/**
 * Zonas del recinto. Es contenido editable: cambia aquí títulos y descripciones.
 * La posición de cada zona está en `plan-layouts.ts`. Los horarios no se escriben aquí: la
 * Arena y Premios agregan los del programa (`PLAN_ZONE_SCHEDULE_NOTES` en `floor-plan-copy.ts`).
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
    description: "Estaciones para las rondas de los torneos.",
  },
  raffles: {
    category: "act",
    kind: "Actividades",
    title: "Premios",
    description: "Exhibición de los premios.",
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
    description: `Stand de la ${division}. Conoce las carreras y los proyectos de la división.`,
  },
  C2: { title: "Inscripción a torneos", description: "Consulta las bases y los horarios de cada torneo." },
  C3: {
    title: "Oferta educativa",
    description: `Información sobre las carreras y el proceso de admisión de la ${universityShortName}.`,
  },
  C4: {
    title: "Patrocinadores",
    description: "Stand de las marcas que apoyan el evento y los premios de los sorteos.",
  },
};

/** Orden de las categorías en filtros, leyenda y directorio. */
export const PLAN_CATEGORIES: readonly PlanCategory[] = ["team", "info", "act", "srv"];

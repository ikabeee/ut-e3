import type { EventActivity, ScheduleEntry } from "@features/event/lib/types";

/**
 * Contenido editable de la portada: presentación, actividades y programa del día.
 * Los `zoneId` del programa deben existir en `floor-plan/lib/plan-places.ts`.
 */
export const EVENT_INTRO = {
  title: ["Juegos hechos", "en la UT Cancún"],
  lead: "Los equipos de la División de Ingeniería y Tecnologías presentan los videojuegos que desarrollaron. Cada equipo tiene un stand con su juego listo para jugar.",
  details:
    "Recorre los stands, prueba las demos y platica con quienes los hicieron. Durante el día hay torneos y sorteos. La entrada es libre.",
} as const;

export const EVENT_HERO = {
  title: "Showcase de videojuegos",
  summary: "Pruébalos, compite en los torneos y participa en los sorteos.",
  callToAction: "Quiero participar",
  reelLabel: "Reel 2026",
} as const;

/** Descripción del encabezado con el número real de juegos del catálogo. */
export function describeShowcase(gameCount: number) {
  return `${gameCount} juegos creados por la División de Ingeniería y Tecnologías. ${EVENT_HERO.summary}`;
}

export const EVENT_ACTIVITIES: readonly EventActivity[] = [
  {
    id: "tournaments",
    place: "Arena de torneos",
    title: "Torneos",
    description:
      "Compite en los juegos de los equipos. Inscríbete en la Arena antes de las 12:00. Las finales se juegan en el main stage.",
    facts: [
      { label: "Inscripción", value: "Hasta 12:00" },
      { label: "Rondas", value: "13:30" },
      { label: "Finales", value: "17:00" },
    ],
  },
  {
    id: "raffles",
    place: "Main stage",
    title: "Sorteos",
    description:
      "Pide tu boleto en el módulo de Información. Hay tres sorteos durante el día y debes estar presente para recoger tu premio.",
    facts: [
      { label: "Primero", value: "13:00" },
      { label: "Segundo", value: "16:00" },
      { label: "Final", value: "19:00" },
    ],
  },
];

export const EVENT_SCHEDULE: readonly ScheduleEntry[] = [
  { time: "10:00", title: "Apertura", zoneId: "entry" },
  { time: "10:30", title: "Presentación de los equipos", zoneId: "stage" },
  { time: "12:00", title: "Cierre de inscripciones a torneos", zoneId: "arena" },
  { time: "13:00", title: "Primer sorteo", zoneId: "stage" },
  { time: "13:30", title: "Rondas de torneos", zoneId: "arena" },
  { time: "16:00", title: "Segundo sorteo", zoneId: "stage" },
  { time: "17:00", title: "Finales de torneos", zoneId: "stage" },
  { time: "19:00", title: "Sorteo final y premiación", zoneId: "stage" },
  { time: "20:00", title: "Cierre", zoneId: "entry" },
];

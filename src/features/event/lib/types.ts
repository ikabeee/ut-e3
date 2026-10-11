/** Fecha, horario y enlaces del evento. Las etiquetas salen de `startsAt` y `endsAt`. */
export interface EventInfo {
  name: string;
  /** Fecha en el formato del diseño ("27.11.2026"). */
  dateLabel: string;
  /** Fecha corta del título del programa ("27.11.26"). */
  shortDateLabel: string;
  /** Horario ("10:00—20:00"). */
  hoursLabel: string;
  /** Inicio y fin en ISO 8601 con la hora de Cancún (UTC-5). */
  startsAt: string;
  endsAt: string;
  admission: string;
  /** Evento prellenado en Google Calendar ("Quiero participar" / "Quiero asistir"). */
  calendarUrl: string;
}

/** Sede del evento. La dirección completa se arma con sus partes (`formatVenueAddress`). */
export interface EventVenue {
  name: string;
  shortName: string;
  /** Referencia corta sobre el título "Ubicación" ("Carretera Cancún–Aeropuerto · Km 11.5"). */
  landmark: string;
  /** Calle y número, sin código postal ni ciudad. */
  streetAddress: string;
  locality: string;
  region: string;
  postalCode: string;
  country: string;
  mapsUrl: string;
}

/** Textos del encabezado de la portada. */
export interface EventHero {
  title: string;
  summary: string;
  callToAction: string;
  reelLabel: string;
}

/** Presentación "Juegos hechos en la UT Cancún". */
export interface EventIntro {
  /** Título en dos renglones. */
  title: readonly [string, string];
  lead: string;
  details: string;
}

/** Video del encabezado: póster y fuentes de la más ligera a la más compatible. */
export interface EventReelMedia {
  poster: string;
  sources: readonly { src: string; type: string }[];
  /** Cuadros por segundo del código de tiempo (00:00:00). */
  framesPerSecond: number;
}

/** Dato corto de una actividad (por ejemplo "Inscripción · Hasta 12:00"). */
export interface ActivityFact {
  label: string;
  value: string;
}

/** Actividad del día con sus horarios (torneos y sorteos). */
export interface EventActivity {
  id: string;
  /** Lugar donde ocurre, como antetítulo. */
  place: string;
  title: string;
  description: string;
  facts: readonly ActivityFact[];
}

/** Renglones del programa cuyo horario citan otros textos (torneos y sorteos). */
export type ScheduleMilestone = "tournamentSignupDeadline" | "tournamentRounds" | "tournamentFinals" | "raffle";

/** Renglón del programa; `zoneId` es la zona del croquis donde ocurre. */
export interface ScheduleEntry {
  time: string;
  title: string;
  zoneId: string;
  /** Si otros textos citan este horario (tarjetas de actividades, detalle del juego, croquis). */
  milestone?: ScheduleMilestone;
}

/**
 * Horarios del programa que se citan en otros textos. Salen de `EVENT_SCHEDULE`
 * (`getScheduleHighlights`), así que nadie vuelve a escribir "12:00" a mano.
 */
export interface ScheduleHighlights {
  tournamentSignupDeadline: string;
  tournamentRoundsAt: string;
  tournamentFinalsAt: string;
  raffleTimes: readonly string[];
}

/** Todo el contenido del evento, leído en un solo lugar (`getEventContent`). */
export interface EventContent {
  info: EventInfo;
  venue: EventVenue;
  hero: EventHero;
  intro: EventIntro;
  activities: readonly EventActivity[];
  schedule: readonly ScheduleEntry[];
  /** Horarios del programa que citan otros textos (torneos y sorteos). */
  highlights: ScheduleHighlights;
  reel: EventReelMedia;
}

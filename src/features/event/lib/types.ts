/** Fecha, horario y enlaces del evento. */
export interface EventInfo {
  name: string;
  /** Fecha en el formato del diseño ("27.11.2026"). */
  dateLabel: string;
  /** Fecha corta del título del programa ("27.11.26"). */
  shortDateLabel: string;
  hoursLabel: string;
  /** Inicio y fin en ISO 8601 (hora de Cancún, UTC-5) para datos estructurados. */
  startsAt: string;
  endsAt: string;
  admission: string;
  organizer: string;
  /** Evento prellenado en Google Calendar ("Quiero participar" / "Quiero asistir"). */
  calendarUrl: string;
}

/** Sede del evento y su dirección. */
export interface EventVenue {
  name: string;
  shortName: string;
  /** Referencia corta sobre el título "Ubicación". */
  landmark: string;
  address: string;
  /** Texto que se copia con "Copiar dirección". */
  copyableAddress: string;
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

/** Renglón del programa; `zoneId` es la zona del croquis donde ocurre. */
export interface ScheduleEntry {
  time: string;
  title: string;
  zoneId: string;
}

/** Todo el contenido del evento, leído en un solo lugar (`getEventContent`). */
export interface EventContent {
  info: EventInfo;
  venue: EventVenue;
  hero: EventHero;
  intro: EventIntro;
  activities: readonly EventActivity[];
  schedule: readonly ScheduleEntry[];
  reel: EventReelMedia;
}

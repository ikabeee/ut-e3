/** Fecha, horario y enlace al calendario del evento. */
export interface EventInfo {
  name: string;
  /** Inicio y fin en ISO 8601 con la hora de Cancún (UTC-5). */
  startsAt: string;
  endsAt: string;
  admission: string;
  /** Evento prellenado en Google Calendar ("Agendar fecha"). */
  calendarUrl: string;
}

/** Sede del evento. */
export interface EventVenue {
  name: string;
  shortName: string;
  /** Calle y número, sin código postal ni ciudad. */
  streetAddress: string;
  locality: string;
  region: string;
  postalCode: string;
  country: string;
}

/** Renglón del programa; `place` es la zona de la sede donde ocurre. */
export interface ScheduleEntry {
  time: string;
  title: string;
  place: string;
}

/** Imagen decorativa sobre el fondo de una tarjeta; `className` la ubica en porcentajes de la tarjeta. */
export interface EventDynamicLayer {
  src: string;
  className: string;
  /** Posición del recorte de la imagen dentro de su caja (por defecto, alineada arriba). */
  imageClassName?: string;
}

/** Torneo o sorteo de la portada. */
export interface EventDynamic {
  id: string;
  kind: "tournament" | "raffle";
  title: string;
  /** Formato del torneo ("1 vs 1"). */
  format?: string;
  /** Cupo de jugadores del torneo. */
  players?: number;
  prize: string;
  /** Sin fondo, la tarjeta usa el color de superficie del tema (el sorteo). */
  backgroundImage?: string;
  /** Proporción y radio propios de la tarjeta (clases de Tailwind); sin esto, 606/416 y radio 25,6 px. */
  cardClassName?: string;
  layers?: readonly EventDynamicLayer[];
}

/**
 * Datos del evento (fecha, horario, sede y enlaces). Es contenido editable: cambia aquí la
 * fecha o la dirección y se actualiza en todo el sitio.
 */
export const EVENT_INFO = {
  name: "UTG · Showcase de videojuegos",
  /** Fecha en el formato del diseño. */
  dateLabel: "27.11.2026",
  /** Fecha corta del título del programa. */
  shortDateLabel: "27.11.26",
  hoursLabel: "10:00—20:00",
  /** Inicio y fin en ISO 8601 (hora de Cancún, UTC-5) para datos estructurados. */
  startsAt: "2026-11-27T10:00:00-05:00",
  endsAt: "2026-11-27T20:00:00-05:00",
  admission: "Entrada libre",
  organizer: "División de Ingeniería y Tecnologías · UT Cancún",
  /** Evento prellenado en Google Calendar ("Quiero participar" / "Quiero asistir"). */
  calendarUrl:
    "https://calendar.google.com/calendar/render?action=TEMPLATE&text=UTG%20%C2%B7%20Showcase%20de%20videojuegos&dates=20261127T150000Z/20261128T010000Z&details=Showcase%20de%20videojuegos%20de%20la%20Divisi%C3%B3n%20de%20Ingenier%C3%ADa%20y%20Tecnolog%C3%ADas.%20Entrada%20libre.&location=Universidad%20Tecnol%C3%B3gica%20de%20Canc%C3%BAn%2C%20Carretera%20Canc%C3%BAn-Aeropuerto%20Km%2011.5%2C%20Canc%C3%BAn%2C%20Q.%20Roo",
} as const;

export const EVENT_VENUE = {
  name: "Universidad Tecnológica de Cancún",
  shortName: "UT Cancún",
  /** Referencia corta sobre el título "Ubicación". */
  landmark: "Carretera Cancún–Aeropuerto · Km 11.5",
  address: "Carretera Cancún–Aeropuerto, Km 11.5, S.M. 299, Mz. 5, Lt. 1, C.P. 77565, Cancún, Quintana Roo.",
  /** Texto que se copia con "Copiar dirección". */
  copyableAddress:
    "Universidad Tecnológica de Cancún, Carretera Cancún-Aeropuerto Km 11.5, S.M. 299, Mz. 5, Lt. 1, C.P. 77565, Cancún, Q. Roo",
  locality: "Cancún",
  region: "Quintana Roo",
  postalCode: "77565",
  country: "MX",
  mapsUrl:
    "https://www.google.com/maps/place/%7C+Universidad+Tecnol%C3%B3gica+de+Canc%C3%BAn+%7C+BIS/data=!4m2!3m1!1s0x0:0x539479cfc0929edb?sa=X&ved=1t:2428&ictx=111",
} as const;

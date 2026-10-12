import {
  buildGoogleCalendarUrl,
  formatCopyableAddress,
  formatDateLabel,
  formatHoursLabel,
  formatShortDateLabel,
} from "@features/event/lib/event-format";
import type { EventInfo, EventVenue } from "@features/event/lib/types";
import { siteConfig } from "@shared/lib/site-config";

/**
 * Sede del evento. Es contenido editable: cambia aquí la dirección y se actualiza en la
 * ubicación, el botón "Copiar dirección", Google Calendar y los datos estructurados.
 */
export const EVENT_VENUE: EventVenue = {
  name: "Universidad Tecnológica de Cancún",
  shortName: "UT Cancún",
  landmark: "Carretera Cancún–Aeropuerto · Km 11.5",
  streetAddress: "Carretera Cancún–Aeropuerto, Km 11.5, S.M. 299, Mz. 5, Lt. 1",
  locality: "Cancún",
  region: "Quintana Roo",
  postalCode: "77565",
  country: "MX",
  mapsUrl:
    "https://www.google.com/maps/place/%7C+Universidad+Tecnol%C3%B3gica+de+Canc%C3%BAn+%7C+BIS/data=!4m2!3m1!1s0x0:0x539479cfc0929edb?sa=X&ved=1t:2428&ictx=111",
};

// Fecha y horario del evento (hora de Cancún, UTC-5). Es el único lugar donde se escriben: las
// etiquetas ("27.11.2026", "10:00—20:00") y el enlace de Google Calendar salen de aquí.
const name = "UTG · Showcase de videojuegos";
const startsAt = "2026-11-27T10:00:00-05:00";
const endsAt = "2026-11-27T20:00:00-05:00";
const admission = "Entrada libre";

/** Datos del evento (fecha, horario y enlaces). */
export const EVENT_INFO: EventInfo = {
  name,
  dateLabel: formatDateLabel(startsAt),
  shortDateLabel: formatShortDateLabel(startsAt),
  hoursLabel: formatHoursLabel(startsAt, endsAt),
  startsAt,
  endsAt,
  admission,
  calendarUrl: buildGoogleCalendarUrl({
    title: name,
    startsAt,
    endsAt,
    details: `Showcase de videojuegos de la ${siteConfig.organization.division}. ${admission}.`,
    location: formatCopyableAddress(EVENT_VENUE),
  }),
};

import type { EventVenue } from "@features/landing/lib/types";

const ISO_LOCAL_PARTS = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Año, mes y día tal como están escritos (hora local del evento, sin convertir). */
function readLocalParts(isoDateTime: string) {
  const match = ISO_LOCAL_PARTS.exec(isoDateTime);

  if (!match) {
    throw new Error(`Fecha inválida: "${isoDateTime}". Usa ISO 8601, por ejemplo 2026-11-20T10:00:00-05:00.`);
  }

  const [, year, month, day] = match;

  return { year, day: Number(day), monthName: MONTH_NAMES[Number(month) - 1] };
}

/** "2026-11-20T10:00:00-05:00" -> "20 Nov 2026". */
export function formatDayMonthYearLabel(isoDateTime: string) {
  const { year, day, monthName } = readLocalParts(isoDateTime);

  return `${day} ${monthName.slice(0, 3)} ${year}`;
}

/** "2026-11-20T10:00:00-05:00" -> "Noviembre 20, 2026". */
export function formatMonthDayYearLabel(isoDateTime: string) {
  const { year, day, monthName } = readLocalParts(isoDateTime);

  return `${monthName} ${day}, ${year}`;
}

/** Fecha en UTC con el formato de Google Calendar: "20261120T150000Z". */
function toCalendarDate(isoDateTime: string) {
  return new Date(isoDateTime)
    .toISOString()
    .replaceAll(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

interface CalendarEvent {
  title: string;
  startsAt: string;
  endsAt: string;
  details: string;
  location: string;
}

/** Enlace que abre Google Calendar con el evento prellenado. */
export function buildGoogleCalendarUrl({ title, startsAt, endsAt, details, location }: CalendarEvent) {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  url.searchParams.set("dates", `${toCalendarDate(startsAt)}/${toCalendarDate(endsAt)}`);
  url.searchParams.set("details", details);
  url.searchParams.set("location", location);

  return url.toString();
}

/** Dirección para el calendario: "Universidad ..., Carretera ..., C.P. 77565, Cancún, Quintana Roo". */
export function formatVenueAddress({ name, streetAddress, postalCode, locality, region }: EventVenue) {
  return `${name}, ${streetAddress}, C.P. ${postalCode}, ${locality}, ${region}`;
}

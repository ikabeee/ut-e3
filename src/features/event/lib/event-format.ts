import type { EventVenue } from "@features/event/lib/types";

const ISO_LOCAL_PARTS = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

/** Año, mes, día, hora y minuto tal como están escritos (hora local del evento, sin convertir). */
function readLocalParts(isoDateTime: string) {
  const match = ISO_LOCAL_PARTS.exec(isoDateTime);
  if (!match) {
    throw new Error(`Fecha inválida: "${isoDateTime}". Usa ISO 8601, por ejemplo 2026-11-27T10:00:00-05:00.`);
  }
  const [, year, month, day, hour, minute] = match;
  return { year, month, day, time: `${hour}:${minute}` };
}

/** "2026-11-27T10:00:00-05:00" -> "27.11.2026". */
export function formatDateLabel(isoDateTime: string) {
  const { year, month, day } = readLocalParts(isoDateTime);
  return `${day}.${month}.${year}`;
}

/** "2026-11-27T10:00:00-05:00" -> "27.11.26". */
export function formatShortDateLabel(isoDateTime: string) {
  const { year, month, day } = readLocalParts(isoDateTime);
  return `${day}.${month}.${year.slice(2)}`;
}

/** Inicio y fin -> "10:00—20:00". */
export function formatHoursLabel(startsAt: string, endsAt: string) {
  return `${readLocalParts(startsAt).time}—${readLocalParts(endsAt).time}`;
}

/** Fecha en UTC con el formato de Google Calendar: "20261127T150000Z". */
function toCalendarDate(isoDateTime: string) {
  return new Date(isoDateTime).toISOString().replaceAll(/[-:]/g, "").replace(/\.\d{3}/, "");
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

type VenueAddress = Pick<EventVenue, "streetAddress" | "postalCode" | "locality" | "region">;

/** Dirección para mostrar: "Carretera ..., Lt. 1, C.P. 77565, Cancún, Quintana Roo." */
export function formatVenueAddress({ streetAddress, postalCode, locality, region }: VenueAddress) {
  return `${streetAddress}, C.P. ${postalCode}, ${locality}, ${region}.`;
}

/** Dirección para copiar o buscar en mapas: con el nombre de la sede y sin punto final. */
export function formatCopyableAddress(venue: VenueAddress & Pick<EventVenue, "name">) {
  return `${venue.name}, ${formatVenueAddress(venue).slice(0, -1)}`;
}

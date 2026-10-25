const CALENDAR_RENDER_URL = "https://calendar.google.com/calendar/render";

export interface CalendarEvent {
  title: string;
  details: string;
  location: string;
  startsAt: string;
  endsAt: string;
}

export function buildCalendarUrl(event: CalendarEvent): string {
  const url = new URL(CALENDAR_RENDER_URL);
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event.title);
  url.searchParams.set("dates", `${toCalendarDate(event.startsAt)}/${toCalendarDate(event.endsAt)}`);
  url.searchParams.set("details", event.details);
  url.searchParams.set("location", event.location);

  return url.toString();
}

function toCalendarDate(instant: string): string {
  return new Date(instant)
    .toISOString()
    .replaceAll(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

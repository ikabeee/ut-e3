import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { EVENT_VENUE, formatCopyableAddress } from "@features/landing/lib/venue";
import { siteConfig } from "@shared/lib/site-config";

const CALENDAR_RENDER_URL = "https://calendar.google.com/calendar/render";

export interface CalendarEvent {
  title: string;
  details: string;
  location: string;
  startsAt: string;
  endsAt: string;
}

export type EventWindow = Pick<CalendarEvent, "startsAt" | "endsAt">;

// The showcase itself, shared by the landing hero and the game page ("Quiero asistir").
export function buildEventCalendarUrl({ startsAt, endsAt }: EventWindow): string {
  return buildCalendarUrl({
    title: siteConfig.title,
    details: LANDING_COPY.calendar.details(siteConfig.organization.division),
    location: formatCopyableAddress(EVENT_VENUE),
    startsAt,
    endsAt,
  });
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

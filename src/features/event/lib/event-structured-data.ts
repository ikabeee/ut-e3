import { describeShowcase } from "@features/event/lib/event-program";
import { EVENT_INFO, EVENT_VENUE } from "@features/event/lib/event-info";
import { EVENT_REEL } from "@features/event/lib/event-media";

/** Datos estructurados (schema.org/Event) de la portada, para buscadores. */
export function buildEventStructuredData(siteUrl: string, gameCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: EVENT_INFO.name,
    description: describeShowcase(gameCount),
    startDate: EVENT_INFO.startsAt,
    endDate: EVENT_INFO.endsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: true,
    image: new URL(EVENT_REEL.poster, siteUrl).toString(),
    url: siteUrl,
    location: {
      "@type": "Place",
      name: EVENT_VENUE.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Carretera Cancún–Aeropuerto, Km 11.5, S.M. 299, Mz. 5, Lt. 1",
        addressLocality: EVENT_VENUE.locality,
        addressRegion: EVENT_VENUE.region,
        postalCode: EVENT_VENUE.postalCode,
        addressCountry: EVENT_VENUE.country,
      },
    },
    organizer: { "@type": "CollegeOrUniversity", name: EVENT_VENUE.name, url: siteUrl },
  };
}

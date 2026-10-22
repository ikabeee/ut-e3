import { EVENT_INFO, EVENT_VENUE } from "@features/landing/lib/event-content";
import { siteConfig } from "@shared/lib/site-config";

/** Datos estructurados (schema.org/Event) de la portada, para buscadores. */
export function buildEventStructuredData(siteUrl: string, gameCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: EVENT_INFO.name,
    description: `${gameCount} juegos creados por la ${siteConfig.organization.division}. Pruébalos, compite en los torneos y participa en los sorteos.`,
    startDate: EVENT_INFO.startsAt,
    endDate: EVENT_INFO.endsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: true,
    image: new URL(siteConfig.shareImage, siteUrl).toString(),
    url: siteUrl,
    location: {
      "@type": "Place",
      name: EVENT_VENUE.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: EVENT_VENUE.streetAddress,
        addressLocality: EVENT_VENUE.locality,
        addressRegion: EVENT_VENUE.region,
        postalCode: EVENT_VENUE.postalCode,
        addressCountry: EVENT_VENUE.country,
      },
    },
    organizer: { "@type": "CollegeOrUniversity", name: siteConfig.organization.university, url: siteUrl },
  };
}

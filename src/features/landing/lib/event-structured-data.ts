import type { EventStructuredDataInput, EventVenue } from "@features/landing/lib/types";
import type { JsonLdRecord } from "@shared/components/json-ld";
import { siteConfig } from "@shared/lib/site-config";

export function buildEventStructuredData(input: EventStructuredDataInput): JsonLdRecord {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: siteConfig.title,
    description: input.description,
    startDate: input.startsAt,
    endDate: input.endsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: true,
    image: new URL(siteConfig.shareImage, input.siteUrl).toString(),
    url: input.siteUrl,
    location: buildPlace(input.venue),
    organizer: {
      "@type": "CollegeOrUniversity",
      name: siteConfig.organization.university,
      url: input.siteUrl,
    },
  };
}

function buildPlace(venue: EventVenue): JsonLdRecord {
  return {
    "@type": "Place",
    name: venue.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.streetAddress,
      addressLocality: venue.locality,
      addressRegion: venue.region,
      postalCode: venue.postalCode,
      addressCountry: venue.country,
    },
  };
}

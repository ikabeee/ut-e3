import type { EventVenue } from "@features/landing/lib/types";
import { siteConfig } from "@shared/lib/site-config";

export const EVENT_VENUE: EventVenue = {
  name: siteConfig.organization.university,
  shortName: siteConfig.organization.universityShortName,
  landmark: "Carretera Cancún–Aeropuerto · Km 11.5",
  streetAddress: "Carretera Cancún–Aeropuerto, Km 11.5, S.M. 299, Mz. 5, Lt. 1",
  locality: "Cancún",
  region: "Quintana Roo",
  postalCode: "77565",
  country: "MX",
  mapsUrl:
    "https://www.google.com/maps/place/%7C+Universidad+Tecnol%C3%B3gica+de+Canc%C3%BAn+%7C+BIS/data=!4m2!3m1!1s0x0:0x539479cfc0929edb?sa=X&ved=1t:2428&ictx=111",
};

export function formatCopyableAddress(venue: EventVenue): string {
  return `${venue.name}, ${formatVenueAddress(venue).slice(0, -1)}`;
}

export function formatVenueAddress(venue: EventVenue): string {
  return `${venue.streetAddress}, C.P. ${venue.postalCode}, ${venue.locality}, ${venue.region}.`;
}

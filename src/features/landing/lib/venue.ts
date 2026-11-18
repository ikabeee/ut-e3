import type { EventVenue } from "@features/landing/lib/types";
import { siteConfig } from "@shared/lib/site-config";

export const EVENT_VENUE: EventVenue = {
  name: siteConfig.organization.university,
  shortName: siteConfig.organization.universityShortName,
  building: "Edificio B",
  coordinates: { latitude: 21.04958, longitude: -86.84682 },
  mapZoom: 17,
  landmark: "Carretera Cancún–Aeropuerto · Km 11.5",
  streetAddress: "Carretera Cancún–Aeropuerto, Km 11.5, S.M. 299, Mz. 5, Lt. 1",
  locality: "Cancún",
  region: "Quintana Roo",
  postalCode: "77565",
  country: "MX",
  mapsUrl: "https://www.google.com/maps?ftid=0x8f4e813ed17d2ee7:0x780343c1035609b1",
};

export function formatCopyableAddress(venue: EventVenue): string {
  return `${venue.name}, ${venue.building}, ${formatVenueAddress(venue).slice(0, -1)}`;
}

export function formatVenueAddress(venue: EventVenue): string {
  return `${venue.streetAddress}, C.P. ${venue.postalCode}, ${venue.locality}, ${venue.region}.`;
}

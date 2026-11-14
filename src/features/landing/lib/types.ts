export interface VenueCoordinates {
  latitude: number;
  longitude: number;
}

export interface EventVenue {
  name: string;
  shortName: string;
  /** The building of the event inside the campus, such as "Edificio B" (SRS 1). */
  building: string;
  coordinates: VenueCoordinates;
  /** Zoom of the venue map; the pin sits at `coordinates`. */
  mapZoom: number;
  landmark: string;
  streetAddress: string;
  locality: string;
  region: string;
  postalCode: string;
  country: string;
  mapsUrl: string;
}

export interface SpecialGuest {
  id: string;
  name: string;
  role?: string;
  talk: string;
  /** A photo from public/, shown in 4:5. Without it the badge shows a placeholder. */
  photo?: { src: string; alt: string };
}

export interface EventStructuredDataInput {
  siteUrl: string;
  description: string;
  startsAt: string;
  endsAt: string;
  venue: EventVenue;
}

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
  /** The road and kilometer of the campus (the venue label of /showcase). */
  landmark: string;
  streetAddress: string;
  locality: string;
  region: string;
  postalCode: string;
  country: string;
  mapsUrl: string;
}

export interface FooterLink {
  href: string;
  label: string;
}

export interface FooterLinkGroup {
  id: string;
  label: string;
  links: readonly FooterLink[];
}

export interface EventFlyer {
  id: "fair" | "tournament";
  src: string;
  width: number;
  height: number;
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

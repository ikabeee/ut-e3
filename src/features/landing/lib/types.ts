export interface EventVenue {
  name: string;
  shortName: string;
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
  role: string;
  talk: string;
}

export interface EventStructuredDataInput {
  siteUrl: string;
  description: string;
  startsAt: string;
  endsAt: string;
  venue: EventVenue;
}

import { buildEventStructuredData } from "@features/landing/lib/event-structured-data";
import { EVENT_VENUE } from "@features/landing/lib/venue";

const SITE_URL = "https://utg.example.com";

function buildData() {
  return buildEventStructuredData({
    siteUrl: SITE_URL,
    description: "Showcase de videojuegos.",
    startsAt: "2026-11-20T17:00:00.000Z",
    endsAt: "2026-11-21T00:00:00.000Z",
    venue: EVENT_VENUE,
  });
}

describe("buildEventStructuredData", () => {
  it("describes a free, in-person schema.org Event with its dates", () => {
    expect(buildData()).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Event",
      startDate: "2026-11-20T17:00:00.000Z",
      endDate: "2026-11-21T00:00:00.000Z",
      isAccessibleForFree: true,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      image: "https://utg.example.com/media/reel.jpg",
      url: SITE_URL,
    });
  });

  it("names the venue place and the university as organizer", () => {
    expect(buildData()).toMatchObject({
      location: {
        "@type": "Place",
        name: "Universidad Tecnológica de Cancún",
        address: {
          addressLocality: "Cancún",
          addressRegion: "Quintana Roo",
          postalCode: "77565",
          addressCountry: "MX",
        },
      },
      organizer: { "@type": "CollegeOrUniversity", name: "Universidad Tecnológica de Cancún", url: SITE_URL },
    });
  });
});

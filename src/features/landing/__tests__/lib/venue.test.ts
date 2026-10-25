import { EVENT_VENUE, formatCopyableAddress, formatVenueAddress } from "@features/landing/lib/venue";

describe("venue", () => {
  it("is the Universidad Tecnológica de Cancún on the Cancún–Aeropuerto highway", () => {
    expect(EVENT_VENUE.name).toBe("Universidad Tecnológica de Cancún");
    expect(EVENT_VENUE.landmark).toBe("Carretera Cancún–Aeropuerto · Km 11.5");
    expect(new URL(EVENT_VENUE.mapsUrl).hostname).toBe("www.google.com");
  });

  it("formats the display address with postal code, city and state", () => {
    expect(formatVenueAddress(EVENT_VENUE)).toBe(
      "Carretera Cancún–Aeropuerto, Km 11.5, S.M. 299, Mz. 5, Lt. 1, C.P. 77565, Cancún, Quintana Roo.",
    );
  });

  it("formats the copyable address with the venue name and no trailing period", () => {
    expect(formatCopyableAddress(EVENT_VENUE)).toBe(
      "Universidad Tecnológica de Cancún, Carretera Cancún–Aeropuerto, Km 11.5, S.M. 299, Mz. 5, Lt. 1, C.P. 77565, Cancún, Quintana Roo",
    );
  });
});

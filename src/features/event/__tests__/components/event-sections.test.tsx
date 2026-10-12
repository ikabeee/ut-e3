import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { EventClosingBanner } from "@features/event/components/event-closing-banner";
import { EventIntroSection } from "@features/event/components/event-intro-section";
import { VenueSection } from "@features/event/components/venue-section";
import type { EventActivity, EventVenue } from "@features/event/lib/types";

// Las secciones reciben el contenido por props: se prueban con una edición inventada del evento.
const venue: EventVenue = {
  name: "Centro de Convenciones",
  shortName: "CC",
  landmark: "Zona hotelera · Km 9",
  streetAddress: "Blvd. Kukulcán Km 9",
  locality: "Cancún",
  region: "Quintana Roo",
  postalCode: "77500",
  country: "MX",
  mapsUrl: "https://maps.example/cc",
};

const activities: EventActivity[] = [
  { id: "talks", place: "Auditorio", title: "Charlas", description: "Charlas de los equipos.", facts: [{ label: "Inicio", value: "11:00" }] },
];

describe("event sections", () => {
  it("writes the admission in two lines next to the date and venue", () => {
    render(<EventClosingBanner admission="Acceso gratuito" dateLabel="01.12.2027" venueShortName="CC" />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Accesogratuito");
    expect(screen.getByText("01.12.2027 · CC")).toBeInTheDocument();
  });

  it("presents the intro and one card per activity", () => {
    render(
      <EventIntroSection
        intro={{ title: ["Segunda", "edición"], lead: "Presentación.", details: "Detalles." }}
        activities={activities}
      />,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Segundaedición");
    expect(screen.getByRole("heading", { level: 3, name: "Charlas" })).toBeInTheDocument();
    expect(screen.getByText("11:00")).toBeInTheDocument();
  });

  it("shows the venue it receives and links to its map", () => {
    // "Copiar dirección" usa una mutación de TanStack Query.
    render(
      <QueryClientProvider client={new QueryClient()}>
        <VenueSection venue={venue} />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { level: 3, name: "Centro de Convenciones" })).toBeInTheDocument();
    expect(screen.getByText("Zona hotelera · Km 9")).toBeInTheDocument();
    expect(screen.getByText("Blvd. Kukulcán Km 9, C.P. 77500, Cancún, Quintana Roo.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /la CC está sobre la carretera/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir en Google Maps/ })).toHaveAttribute("href", "https://maps.example/cc");
  });
});

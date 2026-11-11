import { render, screen } from "@testing-library/react";
import { VenueLocation } from "@features/landing/components/venue-location";
import { EVENT_VENUE } from "@features/landing/lib/venue";

describe("VenueLocation", () => {
  it("shows the venue name, its address and the copy button", () => {
    render(<VenueLocation venue={EVENT_VENUE} />);

    expect(screen.getByRole("heading", { level: 3, name: EVENT_VENUE.name })).toBeInTheDocument();
    expect(screen.getByText(/C\.P\. 77565/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar dirección" })).toBeInTheDocument();
  });

  it("opens Google Maps in a new tab", () => {
    render(<VenueLocation venue={EVENT_VENUE} />);

    const link = screen.getByRole("link", { name: /Abrir en Google Maps/ });

    expect(link).toHaveAttribute("href", EVENT_VENUE.mapsUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("names the Edificio B in the card", () => {
    render(<VenueLocation venue={EVENT_VENUE} />);

    expect(screen.getByText("Edificio B · Lobby y áreas externas")).toBeInTheDocument();
  });

  it("labels the map region and shows the schematic until the map is ready", () => {
    render(<VenueLocation venue={EVENT_VENUE} />);

    const region = screen.getByLabelText("Mapa de la ubicación del evento: Edificio B, UT Cancún");

    expect(region).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("img", { name: /entre el centro y el aeropuerto/ })).toBeInTheDocument();
  });

  it("describes the schematic for assistive technology", () => {
    render(<VenueLocation venue={EVENT_VENUE} />);

    expect(screen.getByRole("img", { name: /entre el centro y el aeropuerto/ })).toBeInTheDocument();
  });
});

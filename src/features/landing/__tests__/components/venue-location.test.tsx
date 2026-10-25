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

  it("describes the schematic for assistive technology", () => {
    render(<VenueLocation venue={EVENT_VENUE} />);

    expect(screen.getByRole("img", { name: /entre el centro y el aeropuerto/ })).toBeInTheDocument();
  });
});

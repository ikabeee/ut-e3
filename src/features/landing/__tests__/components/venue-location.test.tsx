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

  it("names only the Edificio B in the card, with no Sede label nor Lobby y áreas externas", () => {
    const { container } = render(<VenueLocation venue={EVENT_VENUE} isLanding />);

    expect(screen.getByText("Edificio B")).toBeInTheDocument();
    expect(screen.queryByText("Sede")).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent("Lobby");
    expect(container).not.toHaveTextContent("áreas externas");
  });

  it("has no road subtitle above the heading", () => {
    render(<VenueLocation venue={EVENT_VENUE} isLanding />);

    expect(screen.getByRole("heading", { level: 2, name: "Ubicación" }).previousElementSibling).toBeNull();
  });

  it("shows only UT Cancún on the sign of the schematic, with no PIXEL nor road label", () => {
    const { container } = render(<VenueLocation venue={EVENT_VENUE} isLanding />);
    const schematic = screen.getByRole("img", { name: /entre el centro y el aeropuerto/ });
    const labels = Array.from(schematic.querySelectorAll("text")).map((label) => label.textContent);

    expect(labels).toContain("UT CANCÚN");
    expect(labels).not.toContain("PIXEL & CODE");
    expect(labels.join(" ")).not.toMatch(/PIXEL|KM 11|CARRETERA/);
    expect(container.querySelectorAll("svg text")).toHaveLength(labels.length);
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

describe("VenueLocation without isLanding (/showcase, S26)", () => {
  it("shows the road above the heading and the Sede label with the building and its areas in the card", () => {
    render(<VenueLocation venue={EVENT_VENUE} />);

    const heading = screen.getByRole("heading", { level: 2, name: "Ubicación" });

    expect(heading.previousElementSibling).toHaveTextContent("Carretera Cancún–Aeropuerto · Km 11.5");
    expect(screen.getByText("Sede")).toBeInTheDocument();
    expect(screen.getByText("Edificio B · Lobby y áreas externas")).toBeInTheDocument();
  });

  it("shows the event name, the venue and the road on the sign of the schematic", () => {
    render(<VenueLocation venue={EVENT_VENUE} />);

    const schematic = screen.getByRole("img", { name: /entre el centro y el aeropuerto/ });
    const labels = Array.from(schematic.querySelectorAll("text")).map((label) => label.textContent);

    expect(labels).toEqual(
      expect.arrayContaining(["PIXEL & CODE", "UT CANCÚN", "CARRETERA CANCÚN–AEROPUERTO · KM 11.5"]),
    );
  });
});

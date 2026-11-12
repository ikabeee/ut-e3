import { render, screen, within } from "@testing-library/react";
import { CODE_LAB, PIXEL_FORGE, SPONSORS } from "@features/sponsors/__tests__/components/sponsor-test-data";
import { SponsorTickets } from "@features/sponsors/components/sponsor-tickets";
import { SPONSORS_SECTION_ID } from "@features/sponsors/lib/sponsors-links";

function getTickets() {
  return within(screen.getByRole("list", { name: "Patrocinadores del evento" })).getAllByRole("listitem");
}

describe("SponsorTickets", () => {
  it("renders nothing when there are no sponsors", () => {
    const { container } = render(<SponsorTickets sponsors={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("titles the sponsors section and thanks the sponsors under the heading", () => {
    render(<SponsorTickets sponsors={SPONSORS} />);

    const section = screen.getByRole("region", { name: "Patrocinadores" });

    expect(section).toHaveAttribute("id", SPONSORS_SECTION_ID);
    expect(within(section).getByRole("heading", { level: 2, name: "Patrocinadores" })).toBeInTheDocument();
    expect(within(section).getByText("Gracias a quienes hacen posible el evento.")).toBeInTheDocument();
  });

  it("prints one ticket per sponsor in the order it receives them", () => {
    render(<SponsorTickets sponsors={SPONSORS} />);

    const names = getTickets().map((ticket) => within(ticket).getByRole("heading", { level: 3 }).textContent);

    expect(names).toEqual(["Pixel Forge", "North Byte", "Code Lab"]);
  });

  it("numbers each ticket from its display order with three digits", () => {
    render(<SponsorTickets sponsors={[CODE_LAB, PIXEL_FORGE]} />);

    const [first, second] = getTickets();

    expect(within(first).getByText("Nº 001")).toBeInTheDocument();
    expect(within(first).getByText("Patrocinador")).toBeInTheDocument();
    expect(within(second).getByText("Nº 002")).toBeInTheDocument();
  });

  it("shows the logo of each sponsor with its name as the alternative text", () => {
    render(<SponsorTickets sponsors={SPONSORS} />);

    const [first] = getTickets();

    expect(within(first).getByRole("img", { name: "Pixel Forge" })).toHaveAttribute(
      "src",
      expect.stringContaining("pixel-forge.png"),
    );
  });

  it("links the website and the phone of a sponsor that gives both", () => {
    render(<SponsorTickets sponsors={[PIXEL_FORGE]} />);

    expect(screen.getByRole("link", { name: "Visitar sitio" })).toHaveAttribute("href", PIXEL_FORGE.websiteUrl);
    expect(screen.getByRole("link", { name: "998 123 4567" })).toHaveAttribute("href", "tel:+529981234567");
  });

  it("opens the website of a ticket in a new tab without sharing the opener", () => {
    render(<SponsorTickets sponsors={[PIXEL_FORGE]} />);

    const website = screen.getByRole("link", { name: "Visitar sitio" });

    expect(website).toHaveAttribute("target", "_blank");
    expect(website).toHaveAttribute("rel", "noopener noreferrer");
  });
});

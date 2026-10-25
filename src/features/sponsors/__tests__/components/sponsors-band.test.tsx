import { render, screen } from "@testing-library/react";
import { SponsorsBand } from "@features/sponsors/components/sponsors-band";
import type { Sponsor } from "@features/sponsors/lib/types";

const PIXEL_FORGE: Sponsor = {
  id: "pixel-forge",
  name: "Pixel Forge",
  logoPath: "/sponsors/pixel-forge.png",
  websiteUrl: "https://pixel-forge.example",
  phone: "+529981234567",
  services: "Estudio de arte digital",
  position: 1,
};

const NORTH_BYTE: Sponsor = {
  id: "north-byte",
  name: "North Byte",
  logoPath: "/sponsors/north-byte.png",
  websiteUrl: "https://north-byte.example",
  phone: "+529987654321",
  services: "Hospedaje de servidores",
  position: 2,
};

const SPONSORS = [PIXEL_FORGE, NORTH_BYTE];

describe("SponsorsBand", () => {
  it("renders nothing when there are no sponsors", () => {
    const { container } = render(<SponsorsBand sponsors={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the 'Patrocinadores' heading", () => {
    render(<SponsorsBand sponsors={SPONSORS} />);

    expect(screen.getByText("Patrocinadores")).toBeInTheDocument();
  });

  it("renders the logo of each sponsor with its name as alt text", () => {
    render(<SponsorsBand sponsors={SPONSORS} />);

    expect(screen.getByRole("img", { name: "Pixel Forge" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "North Byte" })).toBeInTheDocument();
  });

  it("renders the name of each sponsor", () => {
    render(<SponsorsBand sponsors={SPONSORS} />);

    expect(screen.getAllByText("Pixel Forge").length).toBeGreaterThan(0);
    expect(screen.getAllByText("North Byte").length).toBeGreaterThan(0);
  });

  it("links each visible sponsor to its website in a new tab with a safe rel", () => {
    render(<SponsorsBand sponsors={SPONSORS} />);

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(SPONSORS.length);
    expect(screen.getByRole("link", { name: /Pixel Forge/ })).toHaveAttribute("href", "https://pixel-forge.example");
    expect(screen.getByRole("link", { name: /North Byte/ })).toHaveAttribute("href", "https://north-byte.example");
    links.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("hides the duplicate loop track from assistive technology", () => {
    render(<SponsorsBand sponsors={SPONSORS} />);

    const [visibleName, duplicatedName] = screen.getAllByText("Pixel Forge");

    expect(visibleName.closest('[aria-hidden="true"]')).toBeNull();
    expect(duplicatedName.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("removes the links of the duplicate track from the tab order", () => {
    const { container } = render(<SponsorsBand sponsors={SPONSORS} />);

    const hiddenLinks = container.querySelectorAll('[aria-hidden="true"] a');

    expect(hiddenLinks).toHaveLength(SPONSORS.length);
    hiddenLinks.forEach((link) => expect(link).toHaveAttribute("tabindex", "-1"));
  });
});

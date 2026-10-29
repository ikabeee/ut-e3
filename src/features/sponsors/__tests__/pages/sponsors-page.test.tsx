import { render, screen, within } from "@testing-library/react";
import { PIXEL_FORGE, SPONSORS } from "@features/sponsors/__tests__/components/sponsor-test-data";
import { SponsorsView, sponsorsPageMetadata } from "@features/sponsors/pages/sponsors-page";

function getFirstCard() {
  return within(getCards()[0]);
}

function getCards() {
  return within(screen.getByRole("list", { name: "Patrocinadores del evento" })).getAllByRole("listitem");
}

describe("SponsorsView", () => {
  it("titles the page and shows one card per sponsor in the given order", () => {
    render(<SponsorsView sponsors={SPONSORS} />);

    expect(screen.getByRole("heading", { level: 1, name: "Patrocinadores" })).toBeInTheDocument();
    expect(getCards().map((card) => within(card).getByRole("heading", { level: 2 }).textContent)).toEqual([
      "Pixel Forge",
      "North Byte",
      "Code Lab",
    ]);
  });

  it("shows the logo and the services of each sponsor", () => {
    render(<SponsorsView sponsors={SPONSORS} />);

    expect(getFirstCard().getByRole("img", { name: PIXEL_FORGE.name })).toBeInTheDocument();
    expect(getFirstCard().getByText(PIXEL_FORGE.services)).toBeInTheDocument();
  });

  it("opens the website in a new tab with noopener noreferrer", () => {
    render(<SponsorsView sponsors={SPONSORS} />);

    const website = getFirstCard().getByRole("link", { name: /Visitar sitio/ });

    expect(website).toHaveAttribute("href", PIXEL_FORGE.websiteUrl);
    expect(website).toHaveAttribute("target", "_blank");
    expect(website).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("links the phone with tel: and shows it in a readable format", () => {
    render(<SponsorsView sponsors={SPONSORS} />);

    expect(getFirstCard().getByRole("link", { name: "998 123 4567" })).toHaveAttribute("href", "tel:+529981234567");
  });

  it("shows the site navbar with Inicio", () => {
    render(<SponsorsView sponsors={SPONSORS} />);

    const navigation = within(screen.getByRole("navigation", { name: "Principal" }));

    expect(navigation.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
  });
});

describe("sponsorsPageMetadata", () => {
  it("has its own title, description and canonical URL", () => {
    expect(sponsorsPageMetadata.title).toBe("Patrocinadores");
    expect(sponsorsPageMetadata.description).toEqual(expect.any(String));
    expect(sponsorsPageMetadata.alternates?.canonical).toBe("/sponsors");
  });
});

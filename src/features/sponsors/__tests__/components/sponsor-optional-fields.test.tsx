import { render, screen } from "@testing-library/react";
import { PIXEL_FORGE } from "@features/sponsors/__tests__/components/sponsor-test-data";
import { SponsorCard } from "@features/sponsors/components/sponsor-card";
import { SponsorsCarousel } from "@features/sponsors/components/sponsors-carousel";
import type { Sponsor } from "@features/sponsors/lib/types";

const LOGO_ONLY: Sponsor = { ...PIXEL_FORGE, websiteUrl: "", phone: "", email: null, services: "" };

const WEBSITE_ONLY: Sponsor = { ...LOGO_ONLY, websiteUrl: PIXEL_FORGE.websiteUrl };

const PHONE_ONLY: Sponsor = { ...LOGO_ONLY, phone: PIXEL_FORGE.phone };

const EMAIL_ONLY: Sponsor = { ...LOGO_ONLY, email: "ceo@opset.com.mx" };

describe("SponsorsCarousel with a sponsor that only has a logo", () => {
  it("shows the name and no contact links", () => {
    render(<SponsorsCarousel sponsors={[LOGO_ONLY]} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(LOGO_ONLY.name);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("renders no empty services paragraph", () => {
    const { container } = render(<SponsorsCarousel sponsors={[LOGO_ONLY]} />);

    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("links the website alone when the sponsor has no phone", () => {
    render(<SponsorsCarousel sponsors={[WEBSITE_ONLY]} />);

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Visitar sitio" })).toHaveAttribute("href", PIXEL_FORGE.websiteUrl);
  });

  it("links the phone alone when the sponsor has no website", () => {
    render(<SponsorsCarousel sponsors={[PHONE_ONLY]} />);

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "998 123 4567" })).toHaveAttribute("href", "tel:+529981234567");
  });
});

describe("sponsor email", () => {
  it("shows the contact section with only the email, as a mailto link", () => {
    render(<SponsorsCarousel sponsors={[EMAIL_ONLY]} />);

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "ceo@opset.com.mx" })).toHaveAttribute("href", "mailto:ceo@opset.com.mx");
  });

  it("shows the website, the phone and the email together in the card", () => {
    render(<SponsorCard sponsor={{ ...PIXEL_FORGE, email: "hola@pixel-forge.example" }} />);

    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "hola@pixel-forge.example" })).toHaveAttribute(
      "href",
      "mailto:hola@pixel-forge.example",
    );
  });

  it("renders no mailto link and no extra element when the sponsor has no email", () => {
    const { container } = render(<SponsorCard sponsor={PIXEL_FORGE} />);

    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("renders no contact section for an empty string email", () => {
    const { container } = render(<SponsorCard sponsor={{ ...LOGO_ONLY, email: "" }} />);

    expect(container.querySelector("a")).toBeNull();
  });
});

describe("SponsorCard with a sponsor that only has a logo", () => {
  it("shows the name and the logo without services or contact links", () => {
    const { container } = render(<SponsorCard sponsor={LOGO_ONLY} />);

    expect(screen.getByRole("heading", { level: 2, name: LOGO_ONLY.name })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: LOGO_ONLY.name })).toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});

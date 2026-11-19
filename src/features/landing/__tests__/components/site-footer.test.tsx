import { render, screen, within } from "@testing-library/react";
import { SiteFooter } from "@features/landing/components/site-footer";
import type { FooterLinkGroup } from "@features/landing/lib/types";

const SITEMAP: FooterLinkGroup[] = [
  {
    id: "event",
    label: "Evento",
    links: [
      { href: "/#games", label: "Juegos" },
      { href: "/#venue", label: "Ubicación" },
    ],
  },
  { id: "pages", label: "Páginas", links: [{ href: "/games", label: "Catálogo de juegos" }] },
];

describe("SiteFooter", () => {
  it("shows the showcase name and the organization", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByText("PIXEL & CODE · Showcase de videojuegos")).toBeInTheDocument();
    expect(screen.getByText("División de Ingeniería y Tecnologías · UT Cancún")).toBeInTheDocument();
  });

  it("credits Algorix Insights with a link to its site in a new tab", () => {
    render(<SiteFooter />);

    const credit = screen.getByRole("link", { name: "Algorix Insights" });

    expect(screen.getByText(/Desarrollado y diseñado por/)).toBeInTheDocument();
    expect(credit).toHaveAttribute("href", "https://algorixinsights.com/");
    expect(credit).toHaveAttribute("target", "_blank");
    expect(credit).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("centers the credit line on every width (S8)", () => {
    render(<SiteFooter />);

    expect(screen.getByText(/Desarrollado y diseñado por/)).toHaveClass("text-center");
  });

  it("puts the contact email as a mailto link in the site map (S8)", () => {
    render(<SiteFooter sitemap={SITEMAP} />);

    const sitemap = screen.getByRole("navigation", { name: "Mapa del sitio" });
    const contact = within(sitemap).getByRole("list", { name: "Contacto" });
    const email = within(contact).getByRole("link", { name: "info@algorixinsights.com" });

    expect(email).toHaveAttribute("href", "mailto:info@algorixinsights.com");
    expect(email).not.toHaveAttribute("target");
    expect(email).toHaveClass("pointer-coarse:min-h-11");
  });

  it("has no site map without links to show", () => {
    render(<SiteFooter />);

    expect(screen.queryByRole("navigation", { name: "Mapa del sitio" })).not.toBeInTheDocument();
  });

  it("lists every group of the site map with its links", () => {
    render(<SiteFooter sitemap={SITEMAP} />);

    const sitemap = screen.getByRole("navigation", { name: "Mapa del sitio" });
    const events = within(sitemap).getByRole("list", { name: "Evento" });

    expect(within(events).getByRole("link", { name: "Juegos" })).toHaveAttribute("href", "/#games");
    expect(within(events).getByRole("link", { name: "Ubicación" })).toHaveAttribute("href", "/#venue");
    expect(within(sitemap).getByRole("list", { name: "Páginas" })).toBeInTheDocument();
    expect(within(sitemap).getByRole("link", { name: "Catálogo de juegos" })).toHaveAttribute("href", "/games");
  });

  it("keeps the credits next to the site map", () => {
    render(<SiteFooter sitemap={SITEMAP} />);

    expect(screen.getByRole("link", { name: "Algorix Insights" })).toBeInTheDocument();
    expect(screen.getByText("PIXEL & CODE · Showcase de videojuegos")).toBeInTheDocument();
  });
});

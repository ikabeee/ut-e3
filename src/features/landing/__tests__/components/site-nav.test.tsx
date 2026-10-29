import { render, screen } from "@testing-library/react";
import { SiteNav } from "@features/landing/components/site-nav";

const LINKS = [
  { href: "#juegos", label: "Juegos" },
  { href: "#croquis", label: "Croquis" },
  { href: "#ubicacion", label: "Ubicación" },
];

describe("SiteNav", () => {
  it("renders every link with its label and destination", () => {
    render(<SiteNav homeHref="#top" links={LINKS} />);

    for (const { href, label } of LINKS) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("links the logo back to the top of the page", () => {
    render(<SiteNav homeHref="#top" links={LINKS} />);

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("#top");
  });

  it("links the logo to the home href it receives", () => {
    render(<SiteNav homeHref="/" links={[{ href: "/", label: "Inicio" }]} />);

    expect(screen.getByRole("link", { name: "UTG, inicio" })).toHaveAttribute("href", "/");
  });

  it("is a labelled navigation landmark", () => {
    render(<SiteNav homeHref="#top" links={LINKS} />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});

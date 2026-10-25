import { render, screen } from "@testing-library/react";
import { SiteNav } from "@features/landing/components/site-nav";

const LINKS = [
  { href: "#juegos", label: "Juegos" },
  { href: "#croquis", label: "Croquis" },
  { href: "#ubicacion", label: "Ubicación" },
];

describe("SiteNav", () => {
  it("renders every link with its label and destination", () => {
    render(<SiteNav links={LINKS} />);

    for (const { href, label } of LINKS) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("links the logo back to the top of the page", () => {
    render(<SiteNav links={LINKS} />);

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("#top");
  });

  it("is a labelled navigation landmark", () => {
    render(<SiteNav links={LINKS} />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});

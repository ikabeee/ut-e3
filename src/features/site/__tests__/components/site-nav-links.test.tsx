import { render, screen } from "@testing-library/react";
import { SiteNavLinksView } from "@features/site/components/site-nav-links";

describe("SiteNavLinksView", () => {
  it.each([
    ["/games", "Juegos"],
    ["/games/ruta-9", "Juegos"],
    ["/floor-plan", "Croquis"],
  ])("marks the section of %s as the current page", (pathname, label) => {
    render(<SiteNavLinksView pathname={pathname} />);

    expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  });

  it("does not highlight any link on the home page, as in the design", () => {
    render(<SiteNavLinksView pathname="/" />);

    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("uses the coral underline hover without the scramble on the home page", () => {
    render(<SiteNavLinksView pathname="/" />);

    for (const link of screen.getAllByRole("link")) {
      expect(link.querySelector("span")).toBeNull();
      expect(link).not.toHaveClass("link-wipe");
      expect(link).toHaveClass("hover:text-landing-coral-light", "hover:after:scale-x-100");
    }
  });

  it("keeps the wipe and scramble effects on the other pages", () => {
    render(<SiteNavLinksView pathname="/games" />);

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveClass("link-wipe");
      expect(link.querySelector("span")).not.toBeNull();
    }
  });
});

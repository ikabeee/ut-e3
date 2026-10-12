import { render, screen } from "@testing-library/react";
import { SiteNavLinks } from "@shared/components/site-nav-links";

const mockUsePathname = jest.fn<string, []>();

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("SiteNavLinks", () => {
  it.each([
    ["/games", "Juegos"],
    ["/games/ruta-9", "Juegos"],
    ["/floor-plan", "Croquis"],
  ])("marks the section of %s as the current page", (pathname, label) => {
    mockUsePathname.mockReturnValue(pathname);
    render(<SiteNavLinks />);

    expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  });

  it("does not highlight any link on the home page, as in the design", () => {
    mockUsePathname.mockReturnValue("/");
    render(<SiteNavLinks />);

    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });
});

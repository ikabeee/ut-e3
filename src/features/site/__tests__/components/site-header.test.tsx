import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@features/site/components/site-footer";
import { SiteHeader } from "@features/site/components/site-header";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("SiteHeader and SiteFooter visibility", () => {
  it("renders on public routes", () => {
    jest.mocked(usePathname).mockReturnValue("/");

    const { container: headerContainer } = render(<SiteHeader />);
    expect(headerContainer.firstChild).not.toBeNull();
    expect(screen.getByRole("navigation", { name: "Principal" })).toBeInTheDocument();

    const { container: footerContainer } = render(<SiteFooter />);
    expect(footerContainer.firstChild).not.toBeNull();
  });

  it("does not render on /admin routes", () => {
    jest.mocked(usePathname).mockReturnValue("/admin/teams");

    const { container: headerContainer } = render(<SiteHeader />);
    expect(headerContainer.firstChild).toBeNull();

    const { container: footerContainer } = render(<SiteFooter />);
    expect(footerContainer.firstChild).toBeNull();
  });

  it("does not render on /team routes", () => {
    jest.mocked(usePathname).mockReturnValue("/team");

    const { container: headerContainer } = render(<SiteHeader />);
    expect(headerContainer.firstChild).toBeNull();

    const { container: footerContainer } = render(<SiteFooter />);
    expect(footerContainer.firstChild).toBeNull();
  });
});

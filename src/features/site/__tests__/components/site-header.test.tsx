import { render, screen } from "@testing-library/react";
import { SiteFooterView } from "@features/site/components/site-footer";
import { SiteHeaderView } from "@features/site/components/site-header";

describe("SiteHeader and SiteFooter visibility", () => {
  it("renders on public routes", () => {
    const { container: headerContainer } = render(<SiteHeaderView pathname="/" />);
    expect(headerContainer.firstChild).not.toBeNull();
    expect(screen.getByRole("navigation", { name: "Principal" })).toBeInTheDocument();

    const { container: footerContainer } = render(<SiteFooterView pathname="/" />);
    expect(footerContainer.firstChild).not.toBeNull();
  });

  it("does not render on /admin routes", () => {
    const { container: headerContainer } = render(<SiteHeaderView pathname="/admin/teams" />);
    expect(headerContainer.firstChild).toBeNull();

    const { container: footerContainer } = render(<SiteFooterView pathname="/admin/teams" />);
    expect(footerContainer.firstChild).toBeNull();
  });

  it("does not render on /team routes", () => {
    const { container: headerContainer } = render(<SiteHeaderView pathname="/team" />);
    expect(headerContainer.firstChild).toBeNull();

    const { container: footerContainer } = render(<SiteFooterView pathname="/team" />);
    expect(footerContainer.firstChild).toBeNull();
  });
});

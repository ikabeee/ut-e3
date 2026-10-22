import { render, screen } from "@testing-library/react";
import { SiteFooterView } from "@features/site/components/site-footer";
import { SiteHeaderView } from "@features/site/components/site-header";

describe("SiteHeader and SiteFooter visibility", () => {
  it("renders on public routes", () => {
    const { container: headerContainer } = render(<SiteHeaderView pathname="/" />);
    expect(headerContainer.firstChild).not.toBeNull();
    expect(screen.getByRole("navigation", { name: "Principal" })).toBeInTheDocument();

    const { container: footerContainer } = render(<SiteFooterView pathname="/games" />);
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

  it("renders the light variant with the landing links on the home page", () => {
    render(<SiteHeaderView pathname="/" />);

    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(nav).toHaveAttribute("data-theme", "light");
    expect(nav).toHaveClass("light");
    // Los cinco enlaces del Figma más el de la marca (cubo + "UTGAMES").
    expect(screen.getAllByRole("link").filter((link) => nav.contains(link) && link.textContent)).toHaveLength(6);
    expect(screen.getByRole("link", { name: "UTG, inicio" })).toHaveTextContent("UTGAMES");
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Juegos" })).toHaveAttribute("href", "/games");
    expect(screen.getByRole("link", { name: "Dinámicas" })).toHaveAttribute("href", "/#dynamics");
    expect(screen.getByRole("link", { name: "Programa" })).toHaveAttribute("href", "/#program");
    expect(screen.getByRole("link", { name: "Croquis" })).toHaveAttribute("href", "/floor-plan");
  });

  it("keeps the dark header and the previous links on other pages", () => {
    render(<SiteHeaderView pathname="/games" />);

    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(nav).not.toHaveAttribute("data-theme");
    expect(nav).not.toHaveClass("light");
    expect(screen.getByRole("link", { name: "Mi QR" })).toHaveAttribute("href", "/passport");
    expect(screen.queryByRole("link", { name: "Dinámicas" })).not.toBeInTheDocument();
  });
});

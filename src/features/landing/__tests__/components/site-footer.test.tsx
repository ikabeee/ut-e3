import { render, screen } from "@testing-library/react";
import { SiteFooter } from "@features/landing/components/site-footer";

describe("SiteFooter", () => {
  it("shows the showcase name and the organization", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByText("UTG · Showcase de videojuegos")).toBeInTheDocument();
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
});

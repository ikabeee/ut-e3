import { render, screen } from "@testing-library/react";
import { SiteFooter } from "@features/landing/components/site-footer";

describe("SiteFooter", () => {
  it("shows the showcase name and the organization", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByText("UTG · Showcase de videojuegos")).toBeInTheDocument();
    expect(screen.getByText("División de Ingeniería y Tecnologías · UT Cancún")).toBeInTheDocument();
  });
});

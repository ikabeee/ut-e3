import { render, screen } from "@testing-library/react";
import { LandingPlaceholder } from "@features/landing/components/landing-placeholder";

describe("LandingPlaceholder", () => {
  it("renders the title, the notice and the organization", () => {
    render(<LandingPlaceholder organizationLabel="División · UT" />);

    expect(screen.getByRole("heading", { level: 1, name: "Showcase de videojuegos" })).toBeInTheDocument();
    expect(screen.getByText("Estamos preparando la nueva versión del sitio.")).toBeInTheDocument();
    expect(screen.getByText("División · UT")).toBeInTheDocument();
  });
});

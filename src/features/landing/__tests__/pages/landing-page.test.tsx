import { render, screen } from "@testing-library/react";
import { LandingPage, landingPageMetadata } from "@features/landing/pages/landing-page";
import { siteConfig } from "@shared/lib/site-config";

describe("LandingPage", () => {
  it("publishes the home metadata with the root canonical", () => {
    expect(landingPageMetadata.alternates).toEqual({ canonical: "/" });
  });

  it("renders the placeholder with the site organization", () => {
    render(<LandingPage />);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText(siteConfig.organizationLabel)).toBeInTheDocument();
  });
});

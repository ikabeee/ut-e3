import { render, screen } from "@testing-library/react";
import { LandingIntro } from "@features/landing/components/landing-intro";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

describe("LandingIntro", () => {
  it("renders the title, the lead with the division and the tagline", () => {
    render(<LandingIntro division="División X" />);

    expect(screen.getByRole("heading", { name: LANDING_COPY.intro.title })).toBeInTheDocument();
    expect(screen.getByText(LANDING_COPY.intro.lead("División X"))).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(LANDING_COPY.intro.tagline.length);
  });
});

describe("LandingIntro banner", () => {
  it("renders the banner image", () => {
    render(<LandingIntro division="División X" />);

    expect(screen.getByRole("img", { name: LANDING_COPY.intro.bannerAlt })).toBeInTheDocument();
  });
});

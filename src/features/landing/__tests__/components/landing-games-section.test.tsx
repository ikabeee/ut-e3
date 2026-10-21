import { render, screen } from "@testing-library/react";
import { LandingGamesSection } from "@features/landing/components/landing-games-section";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

describe("LandingGamesSection", () => {
  it("renders the title, the team count and its children", () => {
    render(
      <LandingGamesSection teamCount={18}>
        <p>carrusel</p>
      </LandingGamesSection>,
    );

    expect(screen.getByRole("heading", { name: LANDING_COPY.games.title })).toBeInTheDocument();
    expect(screen.getByText(LANDING_COPY.games.teamCount(18))).toBeInTheDocument();
    expect(screen.getByText("carrusel")).toBeInTheDocument();
  });
});

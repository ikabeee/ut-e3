import { render, screen } from "@testing-library/react";
import { TournamentHeading } from "@features/tournament/components/tournament-heading";

describe("TournamentHeading (S5)", () => {
  it("shows the title of the page as the main heading", () => {
    render(<TournamentHeading />);

    expect(screen.getByRole("heading", { level: 1, name: "Bracket del torneo de KOF" })).toBeInTheDocument();
  });

  it("puts an emblem next to the title that screen readers skip", () => {
    const { container } = render(<TournamentHeading />);

    const emblem = container.querySelector("svg");

    expect(emblem).toHaveAttribute("aria-hidden", "true");
    expect(emblem).toHaveClass("text-accent");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

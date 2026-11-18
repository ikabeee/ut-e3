import { render, screen } from "@testing-library/react";
import { TournamentHeading } from "@features/tournament/components/tournament-heading";

describe("TournamentHeading (S5, S33)", () => {
  it("shows the title of the page as the main heading", () => {
    render(<TournamentHeading />);

    expect(screen.getByRole("heading", { level: 1, name: "Tabla de posiciones" })).toBeInTheDocument();
    expect(screen.queryByText("Bracket del torneo de KOF")).not.toBeInTheDocument();
  });

  it("centers the emblem and the title (S32)", () => {
    const { container } = render(<TournamentHeading />);

    expect(container.firstElementChild).toHaveClass("justify-center", "text-center");
  });

  it("puts an emblem next to the title that screen readers skip", () => {
    const { container } = render(<TournamentHeading />);

    const emblem = container.querySelector("svg");

    expect(emblem).toHaveAttribute("aria-hidden", "true");
    expect(emblem).toHaveClass("text-accent");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

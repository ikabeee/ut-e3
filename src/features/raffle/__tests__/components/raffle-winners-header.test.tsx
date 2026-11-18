import { render, screen } from "@testing-library/react";
import { RaffleWinnersHeader } from "@features/raffle/components/raffle-winners-header";
import { RaffleWinnersList } from "@features/raffle/components/raffle-winners-list";
import { RAFFLE_LIVE_PATH } from "@features/raffle/lib/raffle-links";

describe("RaffleWinnersHeader (S1)", () => {
  it("centers the title, the description and the link to the live drum", () => {
    render(<RaffleWinnersHeader />);

    const header = screen.getByRole("banner");

    expect(header).toHaveClass("justify-items-center", "text-center");
    expect(screen.getByRole("heading", { level: 1, name: "Ganadores de la rifa" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver la tómbola en vivo" })).toHaveAttribute("href", RAFFLE_LIVE_PATH);
  });

  it("shows the raffle ticket emblem as a decorative accent-colored icon", () => {
    render(<RaffleWinnersHeader />);

    const icon = screen.getByTestId("raffle-ticket-icon");

    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("text-accent");
  });
});

describe("RaffleWinnersList empty state (S1)", () => {
  it("centers the message when there are no winners", () => {
    render(<RaffleWinnersList winners={[]} />);

    expect(screen.getByText("Todavía no hay ganadores confirmados.")).toHaveClass("text-center");
  });

  it("keeps listing each winner with ticket, gamertag and prize", () => {
    const winners = [
      { drawId: "a", ticketNumber: 3, gamertag: "Trinity", decidedAt: "2026-11-20T23:06:00.000Z", prizeName: "Taza" },
    ];

    render(<RaffleWinnersList winners={winners} />);

    expect(screen.getByText("Trinity")).toBeInTheDocument();
    expect(screen.getByText("Taza")).toBeInTheDocument();
  });
});

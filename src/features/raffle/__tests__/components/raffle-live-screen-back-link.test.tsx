import { render, screen } from "@testing-library/react";
import { RaffleLiveScreen } from "@features/raffle/components/raffle-live-screen";
import { RAFFLE_WINNERS_PATH } from "@features/raffle/lib/raffle-links";
import { createLiveSnapshot } from "@features/raffle/__tests__/components/raffle-test-snapshots";

describe("RaffleLiveScreen back link (S8)", () => {
  it("shows a visible 44 px link back to /raffle", () => {
    render(<RaffleLiveScreen initial={createLiveSnapshot()} load={jest.fn()} />);

    const back = screen.getByRole("link", { name: "Volver a los ganadores" });

    expect(back).toHaveAttribute("href", RAFFLE_WINNERS_PATH);
    expect(back).toHaveClass("min-h-11");
  });

  it("still lists the confirmed winners next to the way out", () => {
    const winners = [
      {
        drawId: "a",
        ticketNumber: 3,
        gamertag: "Trinity",
        decidedAt: "2026-11-20T23:06:00.000Z",
        prizeName: "Taza",
      },
    ];

    render(<RaffleLiveScreen initial={createLiveSnapshot({ phase: "closed", winners })} load={jest.fn()} />);

    expect(screen.getByText("Taza")).toBeInTheDocument();
  });
});
